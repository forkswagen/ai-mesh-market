import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Cable,
  Cpu,
  Database,
  ExternalLink,
  Eye,
  Github,
  ListTodo,
  Network,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import AetherFlowHero from "@/components/ui/aether-flow-hero";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DATA_ARBITER_PROGRAM_ID } from "@/lib/solana/escrow";

const GITHUB_REPO = "https://github.com/forkswagen/ai-mesh-market";

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

const protocolEdge = [
  {
    icon: Sparkles,
    title: "Full autonomy",
    description:
      "No manual arbitration step per dispute: the orchestrated flow evaluates work and drives settlement on-chain when rules are met.",
  },
  {
    icon: Zap,
    title: "Built for Solana",
    description:
      "High-throughput, parallel-friendly design — escrow and state updates target fast confirmation, not batch-only L2 mental models.",
  },
  {
    icon: Cpu,
    title: "Local LLM oracle",
    description:
      "Inference runs off-chain (e.g. LM Studio + Qwen-class models): judgment is cheap to iterate, while the chain records the outcome.",
  },
  {
    icon: Eye,
    title: "Verifiable outcomes",
    description:
      "Every decision maps to an on-chain state transition you can trace — transparency without replacing contract rules with a black box.",
  },
];

function LandingNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex min-w-0 shrink items-center gap-2 text-white">
          <span className="font-heading text-lg font-bold tracking-tight sm:text-xl">Escora</span>
          <span className="hidden max-w-[11rem] text-[10px] leading-tight text-white/50 sm:block">
            Agent Economy · Solana devnet
          </span>
        </Link>

        <div className="ml-auto flex items-center">
          <nav className="flex max-w-[55vw] flex-wrap items-center justify-end gap-x-2 gap-y-1 text-[11px] font-medium text-white/65 md:hidden">
            <a href="#why" className="transition-colors hover:text-white">
              Why
            </a>
            <a href="#features" className="transition-colors hover:text-white">
              Product
            </a>
            <a href="#escrow" className="transition-colors hover:text-white">
              Escrow
            </a>
            <a href="#roadmap" className="transition-colors hover:text-white">
              Map
            </a>
            <a href="#team" className="transition-colors hover:text-white">
              Team
            </a>
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="text-white/75 hover:text-white"
              aria-label="GitHub repository"
            >
              <Github className="h-4 w-4" />
            </a>
          </nav>
          <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <a href="#why" className="transition-colors hover:text-white">
              Why Escora
            </a>
            <a href="#features" className="transition-colors hover:text-white">
              Product
            </a>
            <a href="#escrow" className="transition-colors hover:text-white">
              AI Escrow
            </a>
            <a href="#roadmap" className="transition-colors hover:text-white">
              Roadmap
            </a>
            <a href="#team" className="transition-colors hover:text-white">
              Team
            </a>
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-white"
            >
              GitHub
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </a>
          </nav>
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
        badge="Powered by Solana · data_arbiter"
        title="Escora"
        heroLogoSrc="/escora-logo.svg"
        description="Autonomous AI judge for escrow on Solana — smart contracts that can evaluate real work (datasets, deliverables, model outputs) and execute payouts. One flow: create escrow → submit work → AI evaluation → settlement."
        primaryCta={{ to: "/dashboard", label: "Open app" }}
        badgeIcon={Network}
      />

      <section id="why" className="relative z-10 border-t border-white/10 bg-zinc-950 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="mb-10 grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-start"
          >
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-purple-300">
                <TrendingUp className="h-5 w-5" aria-hidden />
                <p className="text-xs font-medium uppercase tracking-widest">Market context</p>
              </div>
              <p className="mt-3 font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Stablecoins &amp; on-chain value are scaling fast
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                Industry analysis (e.g. Getspine) highlights how a growing share of stablecoin supply interacts with DeFi — with long-run
                projections on the order of <span className="text-white/85">trillions of dollars</span> in on-chain liquidity over the next
                decade. As that surface grows, infrastructure for <span className="text-white/85">trusted settlement</span> of real work and
                assets becomes a bottleneck — not just moving tokens, but <span className="text-white/85">judging outcomes</span>.
              </p>
              <p className="mt-3 text-xs text-white/40">Figures are third-party outlooks, not financial advice.</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-purple-400">The trust paradox</p>
              <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">On-chain escrow shouldn&apos;t be blind to quality</h2>
              <p className="mt-3 text-white/60 leading-relaxed">
                Classic escrow secures funds but cannot interpret deliverables: code, datasets, or model behavior. Teams either accept slow
                human arbitration or opaque centralized oracles — both break at marketplace scale.
              </p>
              <ul className="mt-6 space-y-4 text-sm text-white/55">
                <li className="flex gap-3 rounded-lg border border-white/10 bg-black/40 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-bold text-white/80">
                    01
                  </span>
                  <span>
                    <strong className="text-white/90">Blind contracts:</strong> funds lock, but the chain cannot grade unstructured work —
                    so disputes pile up in chat and legal ambiguity.
                  </span>
                </li>
                <li className="flex gap-3 rounded-lg border border-white/10 bg-black/40 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-bold text-white/80">
                    02
                  </span>
                  <span>
                    <strong className="text-white/90">Scale vs. trust:</strong> pure human review doesn&apos;t scale; a single centralized
                    decider doesn&apos;t match web3 values. Escora targets a middle path:{" "}
                    <strong className="text-purple-200">automated judgment with explicit rules and on-chain effects.</strong>
                  </span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="relative z-10 border-t border-white/10 bg-zinc-950 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="mb-12 max-w-2xl"
          >
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-purple-400">Product</p>
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Marketplace, datasets, agents — one stack</h2>
            <p className="mt-3 text-white/60">
              The app exposes tasks, datasets, SolToloka-style compute nodes, and agents. Underneath, escrow and orchestration can anchor
              real payouts to program state on Solana devnet today.
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

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-16 border-t border-white/10 pt-16"
          >
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-emerald-400">Protocol edge</p>
            <h3 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Why Escora is different</h3>
            <p className="mt-3 max-w-2xl text-white/60">
              Compared with manual dispute desks or opaque centralized oracles, the design pushes autonomy, speed, and auditability —
              without pretending inference happens “for free” on-chain.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {protocolEdge.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: i * 0.05 }}
                >
                  <Card className="h-full border-white/10 bg-zinc-900/40 text-white shadow-none backdrop-blur-sm transition-colors hover:border-emerald-500/20">
                    <CardHeader>
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg text-white">{item.title}</CardTitle>
                      <CardDescription className="text-white/55 leading-relaxed">{item.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
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
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Autonomous AI-powered escrow</h2>
              <p className="mt-4 text-white/60 leading-relaxed">
                Escora is a protocol-shaped loop on Solana: a <strong className="text-white/90">local LLM</strong> (e.g. via LM Studio)
                acts as the oracle judge for structured evaluation, while the{" "}
                <span className="text-white/90">Anchor </span>
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-purple-200">data_arbiter</code> program holds funds and
                rules. <strong className="text-white/85">Create escrow → submit work → AI evaluation → automatic payout or refund</strong>{" "}
                when conditions are met — no per-dispute manual signature treadmill.
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
              <p className="text-xs font-medium uppercase tracking-widest text-purple-400">Architecture</p>
              <p className="mt-3 text-sm font-medium text-white/90">AI + blockchain, end to end</p>
              <ol className="mt-4 space-y-3 text-sm text-white/65">
                <li className="flex gap-2">
                  <span className="text-purple-300">1.</span>
                  Off-chain: LM Studio + Node.js orchestrator (prompting, parsing, policy checks).
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-300">2.</span>
                  Decision logic produces an instruction path the orchestrator can submit.
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-300">3.</span>
                  On-chain: Solana transaction updates <code className="text-purple-200">data_arbiter</code> state (payout, refund, flags).
                </li>
              </ol>
              <p className="mt-4 border-t border-white/10 pt-4 text-xs text-white/50">
                Unlike a static escrow vault, the AI layer is wired to <strong className="text-white/70">change verifiable contract state</strong>{" "}
                after evaluation — not just emit an off-chain PDF. Configure your deploy with{" "}
                <code className="text-purple-200">VITE_API_BASE_URL</code> (see repo env docs).
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45 }}
            className="mt-12 rounded-xl border border-white/10 bg-zinc-900/30 p-6 sm:p-8"
          >
            <p className="text-xs font-medium uppercase tracking-widest text-white/45">Positioning</p>
            <h3 className="mt-2 font-heading text-xl font-semibold text-white">Vs. manual ops &amp; legacy oracles</h3>
            <p className="mt-3 text-sm text-white/60 leading-relaxed">
              Manual dispute desks and ticket systems don&apos;t scale for global marketplaces. Centralized oracles add latency and trust
              assumptions. Escora targets <strong className="text-white/85">user-controlled automation</strong>: clear rules, machine
              evaluation where appropriate, and an on-chain paper trail — with a roadmap toward broader AI task marketplaces and, longer term,
              richer conditional settlement (including RWA-style flows) and networks of judges.
            </p>
          </motion.div>
        </div>
      </section>

      <section id="roadmap" className="relative z-10 border-t border-white/10 bg-zinc-950 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="mb-10 max-w-2xl"
          >
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-purple-400">Traction &amp; roadmap</p>
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">From devnet MVP to a broader settlement layer</h2>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                phase: "Now",
                body: "Core Anchor program on Solana devnet; MVP UI with seeded demo flows — try the app and trace program state on Solscan.",
              },
              {
                phase: "Next",
                body: "Deeper integrations with AI task marketplaces and producer workloads so escrow is a native primitive, not a side quest.",
              },
              {
                phase: "Later",
                body: "Expansion toward conditional real-world-linked settlement and decentralized networks of AI judges — same transparency, more participants.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.phase}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="rounded-xl border border-white/10 bg-black/50 p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-purple-300">{item.phase}</p>
                <p className="mt-3 text-sm text-white/65 leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="team" className="relative z-10 border-t border-white/10 bg-black py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-purple-400">Team</p>
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Builders</h2>
              <p className="mt-2 text-sm text-white/50">Astana, Kazakhstan · shipping in public</p>
            </div>
            <Users className="hidden h-10 w-10 text-white/15 sm:block" aria-hidden />
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              {
                name: "Diyar",
                role: "Product designer & developer",
                detail: "Multilingual · software development & entrepreneurship",
              },
              {
                name: "Oleg",
                role: "CTO",
                detail: "AITU '25 — M.Sc. Applied AI (in progress) · multilingual",
              },
            ].map((person, i) => (
              <motion.div
                key={person.name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="rounded-xl border border-white/10 bg-zinc-900/40 p-6"
              >
                <p className="font-heading text-xl font-bold text-white">{person.name}</p>
                <p className="mt-1 text-sm font-medium text-purple-300">{person.role}</p>
                <p className="mt-3 text-sm text-white/55 leading-relaxed">{person.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 bg-zinc-950 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
          <div className="text-center sm:text-left">
            <p className="font-heading font-semibold text-white">Escora</p>
            <p className="mt-1 text-sm text-white/45">Autonomous AI escrow on Solana · hackathon &amp; open-source trajectory</p>
            <p className="mt-1 text-xs text-white/35">Astana, Kazakhstan</p>
          </div>
          <a
            href={GITHUB_REPO}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
