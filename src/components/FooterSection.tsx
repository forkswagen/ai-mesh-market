import { Wallet, Globe, Shield } from "lucide-react";

export default function FooterSection() {
  return (
    <footer className="border-t border-border py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            { icon: Wallet, title: "Wallet Auth", desc: "MetaMask, TON, Solana" },
            { icon: Globe, title: "Прозрачность", desc: "Все транзакции и вердикты on-chain" },
            { icon: Shield, title: "Staking", desc: "Стейкинг для снижения комиссий" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <item.icon size={20} className="text-primary mt-0.5" />
              <div>
                <h4 className="font-heading font-semibold text-foreground">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-heading font-bold text-gradient text-lg">NexusAI</span>
          <p className="text-sm text-muted-foreground">© 2026 NexusAI. Децентрализованный AI-маркетплейс.</p>
        </div>
      </div>
    </footer>
  );
}
