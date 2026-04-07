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
    toast.success("Адрес скопирован");
  };
  return (
    <div className="p-6 max-w-3xl space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Настройки · Escora</h1>

      <div className="surface p-5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold text-foreground">Профиль</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Роли</p>
            <div className="flex gap-1.5">
              <Badge variant="outline" className="text-xs border-primary/20 text-primary">Исполнитель</Badge>
              <Badge variant="outline" className="text-xs border-secondary/20 text-secondary">Заказчик</Badge>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Репутация</p>
            <p className="text-foreground font-medium">4.87 / 5.0</p>
          </div>
        </div>
      </div>

      <div className="surface p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-primary" />
            <h2 className="font-heading font-semibold text-foreground">Кошелёк · Phantom</h2>
          </div>
          <div className="flex gap-2">
            {w.connected ? (
              <Button variant="outline" size="sm" className="text-xs" onClick={() => void w.disconnect()}>
                Отключить
              </Button>
            ) : (
              <Button size="sm" className="text-xs" disabled={w.connecting} onClick={() => void w.connect()}>
                {w.connecting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Подключить"}
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          RPC: <code className="bg-muted px-1 rounded break-all">{getSolanaRpcUrl()}</code> — задай <code className="bg-muted px-1 rounded">VITE_SOLANA_RPC_URL</code>{" "}
          (по умолчанию devnet).
        </p>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Адрес (Solana base58)</p>
            <p className="text-sm font-mono text-foreground break-all">{w.address ?? "— не подключено —"}</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs shrink-0 text-muted-foreground" disabled={!w.address} onClick={copyAddr}>
            Скопировать
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">SOL (нативный, по RPC)</p>
            <p className="font-heading text-lg font-bold text-foreground">
              {w.balanceLoading ? "…" : w.solBalance != null ? `${w.solBalance.toFixed(4)} SOL` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">NXS</p>
            <p className="font-heading text-lg font-bold text-muted-foreground">Внутриигровая валюта (MVP UI)</p>
            <p className="text-[11px] text-muted-foreground mt-1">Ончейн-токена NXS в этом репо нет — см. демо-цифры на дашборде.</p>
          </div>
        </div>
        {w.devWalletPubkey && (
          <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
            <span className="font-medium text-foreground">VITE_DEPAI_DEV_WALLET</span> (для JWT к оркестратору, не подменяет Phantom):{" "}
            <span className="font-mono break-all">{w.devWalletPubkey}</span>
          </p>
        )}
      </div>

      <div className="surface p-5 space-y-3">
        <div className="flex items-center gap-3 mb-1">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold text-foreground">Solana · data_arbiter</h2>
        </div>
        <p className="text-xs text-muted-foreground">Program ID (devnet), для интеграции кошелька и Anchor-клиента:</p>
        <p className="text-xs font-mono break-all text-primary">{DATA_ARBITER_PROGRAM_ID.toBase58()}</p>
        <p className="text-xs text-muted-foreground pt-2">
          Прод-бэкенд: <strong>soltoloka-backend</strong> на Vercel; переопределение —{" "}
          <code className="bg-muted px-1 rounded">VITE_API_BASE_URL</code> или{" "}
          <code className="bg-muted px-1 rounded">VITE_SOLToloka_API_URL</code>. Локальный escrow-demo: опционально{" "}
          <code className="bg-muted px-1 rounded">server/</code> в этом монорепо.
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
              В MVP UI-only; интеграция Spark/Flotta и ZK-пайплайн для оркула — следующий этап после escrow-demo
            </p>
          </div>
          <Button variant="outline" size="sm" className="text-xs">
            Скоро
          </Button>
        </div>
      </div>
    </div>
  );
}
