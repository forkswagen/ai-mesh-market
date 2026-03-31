//! DataArbiter: escrow for dataset deals.
//! `ai_judge` is **permissionless** (any signer): e.g. LLM-controlled keypair pays fee and settles.
//! `judge_authority` is optional for **manual** dispute resolution only (`release_to_seller` / `refund_buyer`).
use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("9vZy3wDuyeWiajhxG8WCFxHMXAijrzmCTbmA44XaV7cg");

pub const STATE_AWAITING_DEPOSIT: u8 = 0;
pub const STATE_FUNDED: u8 = 1;
pub const STATE_SUBMITTED: u8 = 2;
pub const STATE_RELEASED: u8 = 3;
pub const STATE_REFUNDED: u8 = 4;

/// Sentinel: manual `release_to_seller` / `refund_buyer` are disabled.
pub const NO_JUDGE_AUTHORITY: Pubkey = Pubkey::new_from_array([0u8; 32]);

/// Max UTF-8 bytes for `reason` in `ai_judge` (keeps tx size safe).
pub const MAX_REASON_LEN: usize = 256;

#[program]
pub mod data_arbiter {
    use super::*;

    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        deal_id: u64,
        amount: u64,
        expected_hash: [u8; 32],
        judge_authority: Option<Pubkey>,
    ) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        let escrow = &mut ctx.accounts.escrow;
        escrow.buyer = ctx.accounts.buyer.key();
        escrow.seller = ctx.accounts.seller.key();
        escrow.judge_authority = judge_authority.unwrap_or(NO_JUDGE_AUTHORITY);
        escrow.deal_id = deal_id;
        escrow.amount = amount;
        escrow.expected_hash = expected_hash;
        escrow.submitted_hash = [0u8; 32];
        escrow.state = STATE_AWAITING_DEPOSIT;
        escrow.bump = ctx.bumps.escrow;
        escrow.ai_judged_at = 0;

        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>) -> Result<()> {
        let amount = {
            let escrow = &ctx.accounts.escrow;
            require!(escrow.state == STATE_AWAITING_DEPOSIT, ErrorCode::InvalidState);
            require!(
                ctx.accounts.buyer.key() == escrow.buyer,
                ErrorCode::Unauthorized
            );
            escrow.amount
        };

        let cpi = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.escrow.to_account_info(),
            },
        );
        transfer(cpi, amount)?;

        let escrow = &mut ctx.accounts.escrow;
        escrow.state = STATE_FUNDED;
        Ok(())
    }

    pub fn submit_dataset_hash(
        ctx: Context<SubmitDataset>,
        submitted_hash: [u8; 32],
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.state == STATE_FUNDED, ErrorCode::InvalidState);
        require!(
            ctx.accounts.seller.key() == escrow.seller,
            ErrorCode::Unauthorized
        );

        escrow.submitted_hash = submitted_hash;
        escrow.state = STATE_SUBMITTED;
        Ok(())
    }

    /// Any signer may call this; atomically releases to seller or refunds buyer and sets `ai_judged_at`.
    pub fn ai_judge(
        ctx: Context<AiJudge>,
        deal_id: u64,
        verdict: bool,
        reason: String,
    ) -> Result<()> {
        require!(
            deal_id == ctx.accounts.escrow.deal_id,
            ErrorCode::InvalidDealId
        );
        require!(reason.len() <= MAX_REASON_LEN, ErrorCode::ReasonTooLong);

        let now = Clock::get()?.unix_timestamp;
        let escrow_key = ctx.accounts.escrow.key();

        if verdict {
            {
                let escrow = &mut ctx.accounts.escrow;
                require!(escrow.state == STATE_SUBMITTED, ErrorCode::InvalidState);
                let amount = escrow.amount;
                let buyer_pk = escrow.buyer;
                let seller_pk = escrow.seller;
                let bump = escrow.bump;
                let id = escrow.deal_id;

                **escrow.to_account_info().try_borrow_mut_lamports()? -= amount;
                **ctx
                    .accounts
                    .seller
                    .to_account_info()
                    .try_borrow_mut_lamports()? += amount;

                escrow.state = STATE_RELEASED;
                escrow.ai_judged_at = now;

                emit!(Released {
                    escrow: escrow_key,
                    buyer: buyer_pk,
                    seller: seller_pk,
                    deal_id: id,
                    amount,
                    bump,
                });
                emit!(AiJudged {
                    escrow: escrow_key,
                    deal_id: id,
                    verdict: true,
                    reason: reason.clone(),
                    judged_at: now,
                });
            }
        } else {
            {
                let escrow = &mut ctx.accounts.escrow;
                require!(
                    escrow.state == STATE_FUNDED || escrow.state == STATE_SUBMITTED,
                    ErrorCode::InvalidState
                );
                let amount = escrow.amount;
                let buyer_pk = escrow.buyer;
                let id = escrow.deal_id;

                **escrow.to_account_info().try_borrow_mut_lamports()? -= amount;
                **ctx
                    .accounts
                    .buyer
                    .to_account_info()
                    .try_borrow_mut_lamports()? += amount;

                escrow.state = STATE_REFUNDED;
                escrow.ai_judged_at = now;

                emit!(Refunded {
                    escrow: escrow_key,
                    buyer: buyer_pk,
                    deal_id: id,
                    amount,
                });
                emit!(AiJudged {
                    escrow: escrow_key,
                    deal_id: id,
                    verdict: false,
                    reason: reason.clone(),
                    judged_at: now,
                });
            }
        }

        Ok(())
    }

    pub fn release_to_seller(ctx: Context<ResolveRelease>) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        require!(escrow.state == STATE_SUBMITTED, ErrorCode::InvalidState);
        require!(
            escrow.judge_authority != NO_JUDGE_AUTHORITY,
            ErrorCode::ManualResolveDisabled
        );
        require!(
            ctx.accounts.judge_authority_signer.key() == escrow.judge_authority,
            ErrorCode::Unauthorized
        );

        let amount = escrow.amount;
        let bump = escrow.bump;
        let buyer = escrow.buyer;
        let seller_key = escrow.seller;
        let deal_id = escrow.deal_id;

        **ctx
            .accounts
            .escrow
            .to_account_info()
            .try_borrow_mut_lamports()? -= amount;
        **ctx
            .accounts
            .seller
            .to_account_info()
            .try_borrow_mut_lamports()? += amount;

        let escrow_key = ctx.accounts.escrow.key();
        let escrow_mut = &mut ctx.accounts.escrow;
        escrow_mut.state = STATE_RELEASED;

        emit!(Released {
            escrow: escrow_key,
            buyer,
            seller: seller_key,
            deal_id,
            amount,
            bump,
        });
        Ok(())
    }

    pub fn refund_buyer(ctx: Context<ResolveRefund>) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        require!(
            escrow.state == STATE_FUNDED || escrow.state == STATE_SUBMITTED,
            ErrorCode::InvalidState
        );
        require!(
            escrow.judge_authority != NO_JUDGE_AUTHORITY,
            ErrorCode::ManualResolveDisabled
        );
        require!(
            ctx.accounts.judge_authority_signer.key() == escrow.judge_authority,
            ErrorCode::Unauthorized
        );

        let amount = escrow.amount;
        let buyer_key = escrow.buyer;
        let deal_id = escrow.deal_id;

        **ctx
            .accounts
            .escrow
            .to_account_info()
            .try_borrow_mut_lamports()? -= amount;
        **ctx
            .accounts
            .buyer
            .to_account_info()
            .try_borrow_mut_lamports()? += amount;

        let escrow_key = ctx.accounts.escrow.key();
        let escrow_mut = &mut ctx.accounts.escrow;
        escrow_mut.state = STATE_REFUNDED;

        emit!(Refunded {
            escrow: escrow_key,
            buyer: buyer_key,
            deal_id,
            amount,
        });
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(deal_id: u64, judge_authority: Option<Pubkey>)]
pub struct InitializeEscrow<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: seller address is persisted in escrow; no direct data read.
    pub seller: UncheckedAccount<'info>,
    #[account(
        init,
        payer = buyer,
        space = 8 + Escrow::INIT_SPACE,
        seeds = [b"escrow", buyer.key().as_ref(), seller.key().as_ref(), &deal_id.to_le_bytes()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"escrow", escrow.buyer.as_ref(), escrow.seller.as_ref(), &escrow.deal_id.to_le_bytes()],
        bump = escrow.bump,
        has_one = buyer @ ErrorCode::Unauthorized
    )]
    pub escrow: Account<'info, Escrow>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitDataset<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(
        mut,
        seeds = [b"escrow", escrow.buyer.as_ref(), escrow.seller.as_ref(), &escrow.deal_id.to_le_bytes()],
        bump = escrow.bump,
        has_one = seller @ ErrorCode::Unauthorized
    )]
    pub escrow: Account<'info, Escrow>,
}

#[derive(Accounts)]
pub struct AiJudge<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.buyer.as_ref(), escrow.seller.as_ref(), &escrow.deal_id.to_le_bytes()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub signer: Signer<'info>,
    /// CHECK: constrained by `address = escrow.seller`.
    #[account(mut, address = escrow.seller)]
    pub seller: UncheckedAccount<'info>,
    /// CHECK: constrained by `address = escrow.buyer`.
    #[account(mut, address = escrow.buyer)]
    pub buyer: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct ResolveRelease<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.buyer.as_ref(), escrow.seller.as_ref(), &escrow.deal_id.to_le_bytes()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut, constraint = judge_authority_signer.key() == escrow.judge_authority @ ErrorCode::Unauthorized)]
    pub judge_authority_signer: Signer<'info>,
    /// CHECK: constrained by `address = escrow.seller`.
    #[account(mut, address = escrow.seller)]
    pub seller: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct ResolveRefund<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.buyer.as_ref(), escrow.seller.as_ref(), &escrow.deal_id.to_le_bytes()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut, constraint = judge_authority_signer.key() == escrow.judge_authority @ ErrorCode::Unauthorized)]
    pub judge_authority_signer: Signer<'info>,
    #[account(mut, address = escrow.buyer)]
    pub buyer: SystemAccount<'info>,
}

#[account]
pub struct Escrow {
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub judge_authority: Pubkey,
    pub deal_id: u64,
    pub amount: u64,
    pub expected_hash: [u8; 32],
    pub submitted_hash: [u8; 32],
    pub state: u8,
    pub bump: u8,
    pub ai_judged_at: i64,
}

impl Escrow {
    pub const INIT_SPACE: usize = 32 + 32 + 32 + 8 + 8 + 32 + 32 + 1 + 1 + 8;
}

#[event]
pub struct Released {
    pub escrow: Pubkey,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub deal_id: u64,
    pub amount: u64,
    pub bump: u8,
}

#[event]
pub struct Refunded {
    pub escrow: Pubkey,
    pub buyer: Pubkey,
    pub deal_id: u64,
    pub amount: u64,
}

#[event]
pub struct AiJudged {
    pub escrow: Pubkey,
    pub deal_id: u64,
    pub verdict: bool,
    pub reason: String,
    pub judged_at: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid escrow state for this instruction.")]
    InvalidState,
    #[msg("Signer is not authorized.")]
    Unauthorized,
    #[msg("Amount must be positive.")]
    InvalidAmount,
    #[msg("Reason string exceeds maximum length.")]
    ReasonTooLong,
    #[msg("deal_id does not match this escrow.")]
    InvalidDealId,
    #[msg("Manual release/refund disabled (no judge_authority set).")]
    ManualResolveDisabled,
}
