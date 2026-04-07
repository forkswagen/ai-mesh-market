import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Cable,
  Database,
  ExternalLink,
  Github,
  ListTodo,
  Network,
  Shield,
  Sparkles,
} from "lucide-react";
import AetherFlowHero from "@/components/ui/aether-flow-hero";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DATA_ARBITER_PROGRAM_ID } from "@/lib/solana/escrow";

const GITHUB_REPO = "https://github.com/forkswagen/ai-mesh-market";
const LIVE_DEMO = "https://ai-mesh-market.vercel.app";

const programIdBase58 = DATA_ARBITER_PROGRAM_ID.toBase58();
const programIdShort = `${programIdBase58.slice(0, 6)}…${programIdBase58.slice(-6)}`;

const features = [
  {
    icon: ListTodo,
    title: "Tasks & NXS",
    description:
      "AI task marketplace: CAPTCHA, annotation, STT/TTS, and model evaluation — with transparent reward economics.",
  },
  {
    icon: Database,
    title: "Datasets",
    description: "Publish and share datasets as first-class platform assets.",
  },
  {
    icon: Cable,
    title: "SolToloka · nodes",
    description: "Compute node registry and status via the SolToloka backend; agent and LM Studio live in a separate repo.",
  },
  {
    icon: Bot,
    title: "AI agents",
    description: "Orchestrate agents across tasks and data — from execution to quality checks.",
  },
];

function LandingNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="font-heading text-sm font-bold text-primary-foreground">E</span>
          </div>
          <div className="leading-tight">
            <span className="font-heading block text-sm font-bold sm:text-base">Escora</span>
            <span className="hidden text-[10px] text-white/50 sm:block">Agent Economy · Solana devnet</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
          <a href="#features" className="transition-colors hover:text-white">
            Features
          </a>
          <a href="#escrow" className="transition-colors hover:text-white">
            AI Escrow
          </a>
          <a
            href={GITHUB_REPO}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-white"
          >
            GitHub
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={LIVE_DEMO}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-lg border border-white/20 px-3 py-2 text-xs font-medium text-white/90 transition-colors hover:bg-white/5 sm:inline-flex"
          >
            Demo
          </a>
          <Link
            to="/dashboard"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-gray-200"
          >
            Open app
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <LandingNav />

      <AetherFlowHero
        badge="Solana devnet · data_arbiter program"
        title="Escora"
        description="Marketplace for tasks, datasets, GPU, and AI agents with on-chain escrow. Autonomous payouts and refunds via ai_judge — trust data deals without manual arbitration."
        primaryCta={{ to: "/dashboard", label: "Open app" }}
        secondaryCta={{ to: "/escrow", label: "AI Escrow" }}
        badgeIcon={Network}
      />

      <section id="features" className="relative z-10 border-t border-white/10 bg-zinc-950 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="mb-12 max-w-2xl"
          >
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-purple-400">Platform</p>
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">One interface — multiple markets</h2>
            <p className="mt-3 text-white/60">
              From human and model tasks to infrastructure and cash flows anchored in the program.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
              >
                <Card className="h-full border-white/10 bg-zinc-900/50 text-white shadow-none backdrop-blur-sm transition-colors hover:border-purple-500/25">
                  <CardHeader className="pb-3">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/15 text-purple-300">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg text-white">{item.title}</CardTitle>
                    <CardDescription className="text-white/55 leading-relaxed">{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="escrow" className="relative z-10 border-t border-white/10 bg-black py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="grid gap-10 lg:grid-cols-2 lg:items-center"
          >
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                AI-oracled escrow
              </div>
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Dataset escrow with an autonomous judge</h2>
              <p className="mt-4 text-white/60 leading-relaxed">
                The <span className="text-white/90">data_arbiter</span> program on Solana locks the deposit, dataset hash, and
                outcome: buyer, seller, and oracle know the rules upfront. After review (including LLM),{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-purple-200">ai_judge</code>
                settles — no manual signing for every dispute.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-white/55">
                <li className="flex gap-2">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
                  Flow: initialize → deposit → hash → evaluation → settlement on devnet
                </li>
                <li className="flex gap-2">
                  <Network className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
                  Program ID:{" "}
                  <span className="font-mono text-white/80" title={programIdBase58}>
                    {programIdShort}
                  </span>
                </li>
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/escrow"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-gray-200"
                >
                  Go to AI Escrow
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={`https://solscan.io/account/${programIdBase58}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-2.5 text-sm font-medium text-white/90 hover:bg-white/5"
                >
                  Solscan (devnet)
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/40 to-zinc-900/80 p-6 sm:p-8">
              <p className="text-xs font-medium uppercase tracking-widest text-purple-400">Orchestrator</p>
              <p className="mt-3 text-sm text-white/70 leading-relaxed">
                A local or deployed API wires the REST contract to transactions: one-click seeded demo in the UI;
                production uses the <strong className="text-purple-200">soltoloka-backend</strong> stack on Vercel when needed, plus{" "}
                <code className="text-purple-200">VITE_API_BASE_URL</code> and server-side CORS.
              </p>
              <p className="mt-4 text-sm text-white/50">Deployment details are in the README (frontend and backend on Vercel).</p>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 bg-zinc-950 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
          <div className="text-center sm:text-left">
            <p className="font-heading font-semibold text-white">Escora</p>
            <p className="mt-1 text-sm text-white/45">Marketplace & AI Escrow · National Solana Hackathon use-case</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white"
            >
              <Github className="h-4 w-4" />
              Source
            </a>
            <a href={LIVE_DEMO} target="_blank" rel="noreferrer" className="text-white/70 hover:text-white">
              Live demo
            </a>
            <Link to="/dashboard" className="text-purple-400 hover:text-purple-300">
              App →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
