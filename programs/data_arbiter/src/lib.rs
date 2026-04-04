use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("9vZy3wDuyeWiajhxG8WCFxHMXAijrzmCTbmA44XaV7cg");

/// Max UTF-8 bytes for `ai_judge` reason string (matches client truncation).
pub const MAX_REASON_LEN: usize = 256;

/// Default pubkey: no manual arbiter; only `ai_judge` (+ buyer/seller flows) settle.
pub const NO_JUDGE_AUTHORITY: Pubkey = Pubkey::new_from_array([0u8; 32]);

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
        escrow.state = EscrowState::AwaitingDeposit as u8;
        escrow.bump = ctx.bumps.escrow;
        escrow.ai_judged_at = 0;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        require!(
            escrow.state == EscrowState::AwaitingDeposit as u8,
            ErrorCode::InvalidState
        );
        require!(
            ctx.accounts.buyer.key() == escrow.buyer,
            ErrorCode::Unauthorized
        );
        let amount = escrow.amount;
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.escrow.to_account_info(),
                },
            ),
            amount,
        )?;
        let escrow = &mut ctx.accounts.escrow;
        escrow.state = EscrowState::Funded as u8;
        Ok(())
    }

    pub fn submit_dataset_hash(
        ctx: Context<SubmitDatasetHash>,
        submitted_hash: [u8; 32],
    ) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        require!(
            escrow.state == EscrowState::Funded as u8,
            ErrorCode::InvalidState
        );
        require!(
            ctx.accounts.seller.key() == escrow.seller,
            ErrorCode::Unauthorized
        );
        let escrow = &mut ctx.accounts.escrow;
        escrow.submitted_hash = submitted_hash;
        escrow.state = EscrowState::Submitted as u8;
        Ok(())
    }

    /// Any signer may settle the deal after submission (demo / autonomous agent).
    pub fn ai_judge(
        ctx: Context<AiJudge>,
        deal_id: u64,
        verdict: bool,
        reason: String,
    ) -> Result<()> {
        require!(
            reason.as_bytes().len() <= MAX_REASON_LEN,
            ErrorCode::ReasonTooLong
        );
        let escrow_ro = &ctx.accounts.escrow;
        require!(escrow_ro.deal_id == deal_id, ErrorCode::InvalidDealId);
        require!(
            escrow_ro.state == EscrowState::Submitted as u8,
            ErrorCode::InvalidState
        );

        let amount = escrow_ro.amount;
        let escrow_ai = ctx.accounts.escrow.to_account_info();
        let rent_min = Rent::get()?.minimum_balance(escrow_ai.data_len());
        let available = escrow_ai
            .lamports()
            .checked_sub(rent_min)
            .ok_or(error!(ErrorCode::InsufficientFunds))?;
        require!(available >= amount, ErrorCode::InsufficientFunds);

        if verdict {
            **escrow_ai.try_borrow_mut_lamports()? = escrow_ai
                .lamports()
                .checked_sub(amount)
                .ok_or(ErrorCode::InsufficientFunds)?;
            **ctx
                .accounts
                .seller
                .to_account_info()
                .try_borrow_mut_lamports()? = ctx
                .accounts
                .seller
                .to_account_info()
                .lamports()
                .checked_add(amount)
                .ok_or(ErrorCode::InsufficientFunds)?;
        } else {
            **escrow_ai.try_borrow_mut_lamports()? = escrow_ai
                .lamports()
                .checked_sub(amount)
                .ok_or(ErrorCode::InsufficientFunds)?;
            **ctx
                .accounts
                .buyer
                .to_account_info()
                .try_borrow_mut_lamports()? = ctx
                .accounts
                .buyer
                .to_account_info()
                .lamports()
                .checked_add(amount)
                .ok_or(ErrorCode::InsufficientFunds)?;
        }

        let escrow = &mut ctx.accounts.escrow;
        escrow.state = if verdict {
            EscrowState::Released as u8
        } else {
            EscrowState::Refunded as u8
        };
        escrow.ai_judged_at = Clock::get()?.unix_timestamp;

        emit!(AiJudged {
            deal_id,
            verdict,
            reason,
            judged_at: escrow.ai_judged_at,
        });
        Ok(())
    }

    pub fn release_to_seller(ctx: Context<ResolveRelease>) -> Result<()> {
        let escrow_ro = &ctx.accounts.escrow;
        require!(
            escrow_ro.judge_authority != NO_JUDGE_AUTHORITY,
            ErrorCode::ManualResolveDisabled
        );
        require!(
            ctx.accounts.judge_authority_signer.key() == escrow_ro.judge_authority,
            ErrorCode::Unauthorized
        );
        require!(
            escrow_ro.state == EscrowState::Submitted as u8,
            ErrorCode::InvalidState
        );

        let amount = escrow_ro.amount;
        let escrow_ai = ctx.accounts.escrow.to_account_info();
        let rent_min = Rent::get()?.minimum_balance(escrow_ai.data_len());
        let available = escrow_ai
            .lamports()
            .checked_sub(rent_min)
            .ok_or(error!(ErrorCode::InsufficientFunds))?;
        require!(available >= amount, ErrorCode::InsufficientFunds);

        **escrow_ai.try_borrow_mut_lamports()? = escrow_ai
            .lamports()
            .checked_sub(amount)
            .ok_or(ErrorCode::InsufficientFunds)?;
        **ctx
            .accounts
            .seller
            .to_account_info()
            .try_borrow_mut_lamports()? = ctx
            .accounts
            .seller
            .to_account_info()
            .lamports()
            .checked_add(amount)
            .ok_or(ErrorCode::InsufficientFunds)?;

        let escrow = &mut ctx.accounts.escrow;
        escrow.state = EscrowState::Released as u8;
        Ok(())
    }

    pub fn refund_buyer(ctx: Context<ResolveRefund>) -> Result<()> {
        let escrow_ro = &ctx.accounts.escrow;
        require!(
            escrow_ro.judge_authority != NO_JUDGE_AUTHORITY,
            ErrorCode::ManualResolveDisabled
        );
        require!(
            ctx.accounts.judge_authority_signer.key() == escrow_ro.judge_authority,
            ErrorCode::Unauthorized
        );
        require!(
            escrow_ro.state == EscrowState::Submitted as u8,
            ErrorCode::InvalidState
        );

        let amount = escrow_ro.amount;
        let escrow_ai = ctx.accounts.escrow.to_account_info();
        let rent_min = Rent::get()?.minimum_balance(escrow_ai.data_len());
        let available = escrow_ai
            .lamports()
            .checked_sub(rent_min)
            .ok_or(error!(ErrorCode::InsufficientFunds))?;
        require!(available >= amount, ErrorCode::InsufficientFunds);

        **escrow_ai.try_borrow_mut_lamports()? = escrow_ai
            .lamports()
            .checked_sub(amount)
            .ok_or(ErrorCode::InsufficientFunds)?;
        **ctx
            .accounts
            .buyer
            .to_account_info()
            .try_borrow_mut_lamports()? = ctx
            .accounts
            .buyer
            .to_account_info()
            .lamports()
            .checked_add(amount)
            .ok_or(ErrorCode::InsufficientFunds)?;

        let escrow = &mut ctx.accounts.escrow;
        escrow.state = EscrowState::Refunded as u8;
        Ok(())
    }
}

#[derive(Clone, Copy, PartialEq, AnchorSerialize, AnchorDeserialize)]
#[repr(u8)]
pub enum EscrowState {
    AwaitingDeposit = 0,
    Funded = 1,
    Submitted = 2,
    Released = 3,
    Refunded = 4,
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

#[derive(Accounts)]
#[instruction(deal_id: u64)]
pub struct InitializeEscrow<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: seller pubkey is only stored; no signing required at init.
    pub seller: UncheckedAccount<'info>,
    #[account(
        init,
        payer = buyer,
        space = 8 + Escrow::INIT_SPACE,
        seeds = [b"escrow", buyer.key().as_ref(), seller.key().as_ref(), deal_id.to_le_bytes().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: must match escrow.seller for PDA seeds (validated below).
    pub seller: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [b"escrow", buyer.key().as_ref(), seller.key().as_ref(), escrow.deal_id.to_le_bytes().as_ref()],
        bump = escrow.bump,
        has_one = buyer,
        has_one = seller,
    )]
    pub escrow: Account<'info, Escrow>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitDatasetHash<'info> {
    /// CHECK: must match escrow.buyer for PDA seeds.
    pub buyer: UncheckedAccount<'info>,
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(
        mut,
        seeds = [b"escrow", buyer.key().as_ref(), seller.key().as_ref(), escrow.deal_id.to_le_bytes().as_ref()],
        bump = escrow.bump,
        has_one = buyer,
        has_one = seller,
    )]
    pub escrow: Account<'info, Escrow>,
}

#[derive(Accounts)]
#[instruction(deal_id: u64)]
pub struct AiJudge<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    /// CHECK: must match escrow.seller for lamport destination / PDA check.
    #[account(mut)]
    pub seller: UncheckedAccount<'info>,
    /// CHECK: must match escrow.buyer for lamport destination / PDA check.
    #[account(mut)]
    pub buyer: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [b"escrow", buyer.key().as_ref(), seller.key().as_ref(), deal_id.to_le_bytes().as_ref()],
        bump = escrow.bump,
        has_one = buyer,
        has_one = seller,
    )]
    pub escrow: Account<'info, Escrow>,
}

#[derive(Accounts)]
pub struct ResolveRelease<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.buyer.as_ref(), escrow.seller.as_ref(), escrow.deal_id.to_le_bytes().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut, constraint = judge_authority_signer.key() == escrow.judge_authority @ ErrorCode::Unauthorized)]
    pub judge_authority_signer: Signer<'info>,
    /// CHECK: escrow.seller — lamport receiver.
    #[account(mut)]
    pub seller: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct ResolveRefund<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.buyer.as_ref(), escrow.seller.as_ref(), escrow.deal_id.to_le_bytes().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut, constraint = judge_authority_signer.key() == escrow.judge_authority @ ErrorCode::Unauthorized)]
    pub judge_authority_signer: Signer<'info>,
    /// CHECK: escrow.buyer — lamport receiver.
    #[account(mut)]
    pub buyer: UncheckedAccount<'info>,
}

#[event]
pub struct AiJudged {
    pub deal_id: u64,
    pub verdict: bool,
    pub reason: String,
    pub judged_at: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid escrow state")]
    InvalidState,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient funds in escrow")]
    InsufficientFunds,
    #[msg("Reason string too long")]
    ReasonTooLong,
    #[msg("Deal id mismatch")]
    InvalidDealId,
    #[msg("Manual resolve disabled (no judge authority set)")]
    ManualResolveDisabled,
}
