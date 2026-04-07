import { LayoutDashboard, ListTodo, Database, Shield, Bot, Settings, Wallet, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { truncateSolanaAddress } from "@/lib/solana/walletDisplay";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Tasks", url: "/tasks", icon: ListTodo },
  { title: "Datasets", url: "/datasets", icon: Database },
  { title: "Agents", url: "/agents", icon: Bot },
  { title: "AI Escrow", url: "/escrow", icon: Shield },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const w = useSolanaWallet();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <Link
          to="/"
          title="Home (landing)"
          className="flex items-center gap-2 rounded-md outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent/80 focus-visible:ring-2 -m-1 p-1"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-heading font-bold text-sm">E</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-bold text-foreground text-lg leading-tight">Escora</span>
              <span className="text-[10px] text-muted-foreground truncate">Agent Economy · AI Escrow (devnet)</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/60 text-xs uppercase tracking-wider">
            {!collapsed ? "Platform" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/settings"
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                activeClassName="bg-sidebar-accent text-primary font-medium"
              >
                <Settings className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span className="text-sm">Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {!collapsed && (
          <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border space-y-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground">Solana · Phantom</span>
            </div>
            {w.connected && w.address ? (
              <>
                <p className="text-xs text-foreground font-mono truncate" title={w.address}>
                  {truncateSolanaAddress(w.address)}
                </p>
                <p className="text-xs font-medium text-primary">
                  {w.balanceLoading ? (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      SOL…
                    </span>
                  ) : w.solBalance != null ? (
                    <>
                      {w.solBalance.toFixed(4)} SOL
                      <span className="block text-[10px] text-muted-foreground font-normal mt-0.5">
                        network: see VITE_SOLANA_RPC_URL (devnet)
                      </span>
                    </>
                  ) : (
                    "SOL — unavailable"
                  )}
                </p>
                <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={() => void w.disconnect()}>
                  Disconnect
                </Button>
              </>
            ) : (
              <>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Connect Phantom for a real address and SOL balance. NXS in the demo is an off-chain UI unit.
                </p>
                <Button
                  size="sm"
                  className="w-full h-7 text-xs"
                  disabled={w.connecting}
                  onClick={() => void w.connect()}
                >
                  {w.connecting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : w.hasPhantom ? (
                    "Connect"
                  ) : (
                    "No Phantom"
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
