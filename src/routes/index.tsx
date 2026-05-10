import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { StarField, Sigil } from "@/components/oracle/StarField";
import { WalletPanel } from "@/components/oracle/WalletPanel";
import { Composer } from "@/components/oracle/Composer";
import { Archive } from "@/components/oracle/Archive";
import { VerdictReveal } from "@/components/oracle/VerdictReveal";
import { ReputationBadge } from "@/components/oracle/ReputationBadge";
import type { Capsule } from "@/lib/types";
import { networkInfo } from "@/lib/genlayer";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [address, setAddress] = useState<string | null>(null);
  const [opened, setOpened] = useState<Capsule | null>(null);
  const [archiveKey, setArchiveKey] = useState(0);

  function handleSealed(cap: Capsule) {
    setOpened(cap);
    setArchiveKey((k) => k + 1);
  }

  function handleResolved(cap: Capsule) {
    setOpened(cap);
    setArchiveKey((k) => k + 1);
  }

  const net = networkInfo();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-cosmos text-parchment">
      <StarField />

      {/* Top bar */}
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 pt-6 sm:px-8">
        <a href="#" className="flex items-center gap-3">
          <Sigil className="size-9 text-gold flicker" />
          <span className="font-display text-base uppercase tracking-[0.4em] text-gold">
            Oraculum
          </span>
        </a>
        <WalletPanel address={address} onChange={setAddress} />
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16 pt-12 sm:px-8 sm:pt-20">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-mono text-[10px] uppercase tracking-[0.5em] text-gold-soft"
        >
          ✦ Bound to {net.chainName} · Verdict by AI Council
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 font-display text-[clamp(2.4rem,6vw,5.4rem)] leading-[1.02]"
        >
          <span className="block">Speak the prophecy.</span>
          <span className="block text-gold italic">Seal it in starlight.</span>
          <span className="block">Let the chain remember.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 max-w-2xl font-body text-lg italic leading-relaxed text-muted-foreground sm:text-xl"
        >
          Inscribe any prediction. Markets, elections, technology, sport, the
          private oaths you hold yourself to. Set an hour. When that hour
          falls, an AI council convenes, weighs the evidence, and renders a
          verdict: <span className="text-emerald-rune">truth</span>,{" "}
          <span className="text-ember">falsehood</span>, or{" "}
          <span className="text-smoke">silence</span>, written into the chain
          forever.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <a
            href="#compose"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-gold to-gold-soft px-6 py-3 font-display text-sm uppercase tracking-[0.25em] text-primary-foreground shadow-lg shadow-gold/30 transition hover:brightness-110"
          >
            Inscribe a Prophecy
          </a>
          <a
            href="#archive"
            className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-6 py-3 font-display text-sm uppercase tracking-[0.25em] text-gold-soft transition hover:border-gold hover:text-gold"
          >
            Read the Archive
            <ChevronDown className="size-4" />
          </a>
        </motion.div>

        {address && (
          <div className="mt-8">
            <ReputationBadge address={address} refreshKey={archiveKey} />
          </div>
        )}

        {/* Three-step ritual */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-14 grid gap-4 sm:grid-cols-3"
        >
          {RITUAL.map((r, i) => (
            <div
              key={r.title}
              className="gilded rounded-xl p-5"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-gold-soft">
                Rite {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 font-display text-lg text-parchment">{r.title}</h3>
              <p className="mt-2 font-body text-sm italic leading-relaxed text-muted-foreground">
                {r.body}
              </p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Compose */}
      <section className="relative z-10 mx-auto max-w-3xl px-5 pb-20 sm:px-8">
        <Composer connected={!!address} onSealed={handleSealed} />
      </section>

      {/* Archive */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <Archive
          refreshKey={archiveKey}
          onOpen={setOpened}
          onResolved={handleResolved}
        />
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gold/15">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 font-mono text-[10px] uppercase tracking-[0.3em] text-gold-soft sm:px-8">
          <span>✶ Oraculum · A prophecy board on GenLayer</span>
          <span>I bet · the AI judges · the chain remembers</span>
        </div>
      </footer>

      <VerdictReveal capsule={opened} onClose={() => setOpened(null)} />
    </div>
  );
}

const RITUAL = [
  {
    title: "Inscribe",
    body: "Speak your prediction in plain words. Name the oracle (a URL, an API, a public source) by which the truth shall be measured.",
  },
  {
    title: "Seal",
    body: "Choose the hour of unsealing. The capsule passes onto the chain, immutable, untouchable, even by you.",
  },
  {
    title: "Reveal",
    body: "When the hour strikes, any soul may summon the AI council. Their verdict is etched into the chain, for all time.",
  },
];
