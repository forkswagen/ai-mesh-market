import { Wallet, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileStats, useSetPrivacy } from "@/hooks/use-api";
import { toast } from "sonner";
import { useState } from "react";

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuth();
  const { data: stats } = useProfileStats();
  const setPrivacy = useSetPrivacy();
  const [privacyEnabled, setPrivacyEnabled] = useState(true);

  const handlePrivacyToggle = () => {
    const newValue = !privacyEnabled;
    setPrivacy.mutate(newValue, {
      onSuccess: () => {
        setPrivacyEnabled(newValue);
        toast.success(`Privacy Mode ${newValue ? "включён" : "выключен"}`);
      },
      onError: (err) => toast.error((err as Error).message),
    });
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Настройки DataArbiter</h1>

      <div className="surface p-5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold text-foreground">Профиль</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Роли</p>
            <div className="flex gap-1.5">
              <Badge variant="outline" className="text-xs border-primary/20 text-primary">
                {user?.is_provider ? "Исполнитель" : "Заказчик"}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Репутация</p>
            <p className="text-foreground font-medium">
              {stats?.reputation?.toFixed(2) ?? "—"} / 5.0
            </p>
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
            <p className="text-sm font-mono text-foreground">
              {isAuthenticated && user ? user.wallet : "Не подключён"}
            </p>
          </div>
          {user && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => {
                navigator.clipboard.writeText(user.wallet);
                toast.success("Скопировано!");
              }}
            >
              Скопировать
            </Button>
          )}
        </div>
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Заработано</p>
              <p className="font-heading text-lg font-bold text-foreground">{stats.total_earned} SOL</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Задач выполнено</p>
              <p className="font-heading text-lg font-bold text-foreground">{stats.tasks_completed}</p>
            </div>
          </div>
        )}
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
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={handlePrivacyToggle}
            disabled={setPrivacy.isPending}
          >
            {privacyEnabled ? "Включён" : "Выключен"}
          </Button>
        </div>
      </div>
    </div>
  );
}
