import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Search, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { truncateSolanaAddress } from "@/lib/solana/walletDisplay";

export default function AppHeader() {
  const w = useSolanaWallet();
  return (
    <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks, datasets, agents..."
            className="w-80 pl-9 h-9 bg-muted border-border text-sm placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground max-w-[140px]"
          title={w.address || undefined}
          onClick={() => {
            if (!w.connected) void w.connect();
          }}
        >
          <Wallet className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline text-xs font-mono truncate">
            {w.connected && w.address ? truncateSolanaAddress(w.address) : "Wallet"}
          </span>
        </Button>
        <div className="w-8 h-8 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center">
          <span className="text-xs font-medium text-secondary">AI</span>
        </div>
      </div>
    </header>
  );
}
