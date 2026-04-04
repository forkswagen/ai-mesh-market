import { Settings, Wallet, Shield, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DATA_ARBITER_PROGRAM_ID } from "@/lib/solana/escrow";

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-3xl space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Настройки · NexusAI</h1>

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
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold text-foreground">Кошелёк</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Адрес</p>
            <p className="text-sm font-mono text-foreground">0x7a3B4c5D6e7F8a9B0c1D2E3f4A5b6C7d8E9fE2</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Скопировать</Button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><p className="text-xs text-muted-foreground mb-1">NXS</p><p className="font-heading text-lg font-bold text-foreground">1,250</p></div>
          <div><p className="text-xs text-muted-foreground mb-1">USDT</p><p className="font-heading text-lg font-bold text-foreground">340</p></div>
          <div><p className="text-xs text-muted-foreground mb-1">Staked</p><p className="font-heading text-lg font-bold text-primary">500 NXS</p></div>
        </div>
      </div>

      <div className="surface p-5 space-y-3">
        <div className="flex items-center gap-3 mb-1">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold text-foreground">Solana · data_arbiter</h2>
        </div>
        <p className="text-xs text-muted-foreground">Program ID (devnet), для интеграции кошелька и Anchor-клиента:</p>
        <p className="text-xs font-mono break-all text-primary">{DATA_ARBITER_PROGRAM_ID.toBase58()}</p>
      </div>

      <div className="surface p-5">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold text-foreground">Privacy Mode</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground">Глобальный Privacy Mode</p>
            <p className="text-xs text-muted-foreground">E2E шифрование, данные не сохраняются</p>
          </div>
          <Button variant="outline" size="sm" className="text-xs">Включён</Button>
        </div>
      </div>
    </div>
  );
}
