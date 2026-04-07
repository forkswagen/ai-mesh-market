import { Wallet, Shield, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DATA_ARBITER_PROGRAM_ID } from "@/lib/solana/escrow";
import { getSolanaRpcUrl } from "@/lib/solana/rpc";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { toast } from "sonner";

export default function SettingsPage() {
  const w = useSolanaWallet();
  const copyAddr = () => {
    if (!w.address) return;
    void navigator.clipboard.writeText(w.address);
    toast.success("Address copied");
  };
  return (
    <div className="p-6 max-w-3xl space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Settings · Escora</h1>

      <div className="surface p-5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold text-foreground">Profile</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Roles</p>
            <div className="flex gap-1.5">
              <Badge variant="outline" className="text-xs border-primary/20 text-primary">
                Worker
              </Badge>
              <Badge variant="outline" className="text-xs border-secondary/20 text-secondary">
                Client
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Reputation</p>
            <p className="text-foreground font-medium">4.87 / 5.0</p>
          </div>
        </div>
      </div>

      <div className="surface p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-primary" />
            <h2 className="font-heading font-semibold text-foreground">Wallet · Phantom</h2>
          </div>
          <div className="flex gap-2">
            {w.connected ? (
              <Button variant="outline" size="sm" className="text-xs" onClick={() => void w.disconnect()}>
                Disconnect
              </Button>
            ) : (
              <Button size="sm" className="text-xs" disabled={w.connecting} onClick={() => void w.connect()}>
                {w.connecting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Connect"}
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          RPC: <code className="bg-muted px-1 rounded break-all">{getSolanaRpcUrl()}</code> — set{" "}
          <code className="bg-muted px-1 rounded">VITE_SOLANA_RPC_URL</code> (defaults to devnet).
        </p>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Address (Solana base58)</p>
            <p className="text-sm font-mono text-foreground break-all">{w.address ?? "— not connected —"}</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs shrink-0 text-muted-foreground" disabled={!w.address} onClick={copyAddr}>
            Copy
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">SOL (native, via RPC)</p>
            <p className="font-heading text-lg font-bold text-foreground">
              {w.balanceLoading ? "…" : w.solBalance != null ? `${w.solBalance.toFixed(4)} SOL` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">NXS</p>
            <p className="font-heading text-lg font-bold text-muted-foreground">In-game currency (MVP UI)</p>
            <p className="text-[11px] text-muted-foreground mt-1">There is no on-chain NXS token in this repo — see demo figures on the dashboard.</p>
          </div>
        </div>
        {w.devWalletPubkey && (
          <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
            <span className="font-medium text-foreground">VITE_DEPAI_DEV_WALLET</span> (for orchestrator JWT, does not replace Phantom):{" "}
            <span className="font-mono break-all">{w.devWalletPubkey}</span>
          </p>
        )}
      </div>

      <div className="surface p-5 space-y-3">
        <div className="flex items-center gap-3 mb-1">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold text-foreground">Solana · data_arbiter</h2>
        </div>
        <p className="text-xs text-muted-foreground">Program ID (devnet) for wallet and Anchor client integration:</p>
        <p className="text-xs font-mono break-all text-primary">{DATA_ARBITER_PROGRAM_ID.toBase58()}</p>
        <p className="text-xs text-muted-foreground pt-2">
          Main API: deploy <code className="bg-muted px-1 rounded">server/</code> — variable{" "}
          <code className="bg-muted px-1 rounded">VITE_API_BASE_URL</code>. SolToloka page (optional):{" "}
          <code className="bg-muted px-1 rounded">VITE_SOLToloka_API_URL</code>.
        </p>
      </div>

      <div className="surface p-5">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold text-foreground">Privacy / ZK (roadmap)</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground">Federated + privacy toggle</p>
            <p className="text-xs text-muted-foreground">
              MVP is UI-only; Spark/Flotta and a ZK pipeline for the oracle are the next step after the escrow demo
            </p>
          </div>
          <Button variant="outline" size="sm" className="text-xs">
            Coming soon
          </Button>
        </div>
      </div>
    </div>
  );
}
