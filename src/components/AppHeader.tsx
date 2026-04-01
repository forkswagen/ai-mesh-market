import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Search, Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications, useMarkNotificationRead } from "@/hooks/use-api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AppHeader() {
  const { user, isAuthenticated, isConnecting, connect, disconnect } = useAuth();
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск задач, датасетов, агентов..."
            className="w-80 pl-9 h-9 bg-muted border-border text-sm placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-primary rounded-full text-[8px] flex items-center justify-center text-primary-foreground font-bold">
                  {unreadCount > 9 ? "9+" : ""}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            {notifications && notifications.length > 0 ? (
              notifications.slice(0, 8).map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className={`flex flex-col items-start gap-1 py-2 cursor-pointer ${!n.read ? "bg-muted/30" : ""}`}
                  onClick={() => !n.read && markRead.mutate(n.id)}
                >
                  <span className="text-sm text-foreground">{n.text}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("ru-RU")}
                  </span>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled className="text-sm text-muted-foreground">
                Нет уведомлений
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Wallet */}
        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-mono">
                  {user.wallet.slice(0, 4)}...{user.wallet.slice(-4)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-xs font-mono text-muted-foreground">
                {user.wallet}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={disconnect} className="text-destructive">
                <LogOut className="h-3.5 w-3.5 mr-2" /> Отключить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            size="sm"
            onClick={connect}
            disabled={isConnecting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs gap-2"
          >
            <Wallet className="h-4 w-4" />
            {isConnecting ? "Подключение..." : "Подключить кошелёк"}
          </Button>
        )}

        <div className="w-8 h-8 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center">
          <span className="text-xs font-medium text-secondary">
            {isAuthenticated ? user?.wallet.slice(0, 2).toUpperCase() : "?"}
          </span>
        </div>
      </div>
    </header>
  );
}
