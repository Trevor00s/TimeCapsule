import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, BookOpen } from "lucide-react";
import { toast } from "sonner";
import {
  getCapsule,
  getRecentCapsules,
  getTotalCapsules,
  resolveCapsule,
  isContractConfigured,
} from "@/lib/genlayer";
import type { Capsule, RecentCapsule } from "@/lib/types";
import { CapsuleCard } from "./CapsuleCard";

export function Archive({
  refreshKey,
  onOpen,
  onResolved,
}: {
  refreshKey: number;
  onOpen: (c: Capsule) => void;
  onResolved: (c: Capsule) => void;
}) {
  const [items, setItems] = useState<RecentCapsule[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  async function load() {
    if (!isContractConfigured()) return;
    try {
      setLoading(true);
      const [recent, count] = await Promise.all([
        getRecentCapsules(24),
        getTotalCapsules(),
      ]);
      setItems(recent);
      setTotal(count);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [refreshKey]);

  useEffect(() => {
    const id = setInterval(() => {
      // gentle re-render so countdowns tick & "ready" badges flip
      setItems((p) => [...p]);
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  async function handleOpen(rc: RecentCapsule) {
    try {
      const full = await getCapsule(rc.id);
      onOpen(full);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleResolve(rc: RecentCapsule) {
    try {
      setResolvingId(rc.id);
      toast("The council convenes…", {
        description: "AI validators are gathering evidence.",
      });
      const cap = await resolveCapsule(rc.id);
      onResolved(cap);
      load();
    } catch (e) {
      toast.error("The council could not convene", {
        description: (e as Error).message,
      });
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <section id="archive" className="relative">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-gold-soft">
            ✶ Liber Prophetiae
          </p>
          <h2 className="font-display text-2xl uppercase tracking-[0.2em] text-parchment sm:text-3xl">
            The Archive
          </h2>
          <p className="mt-1 font-body italic text-muted-foreground">
            {total > 0
              ? `${total} prophec${total === 1 ? "y" : "ies"} bound to the chain.`
              : "No prophecy yet bears witness here."}
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-gold-soft hover:border-gold hover:text-gold"
        >
          <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Reading the runes" : "Refresh"}
        </button>
      </header>

      {!isContractConfigured() ? (
        <ConfigBanner />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <motion.div
          layout
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((c) => (
            <CapsuleCard
              key={c.id}
              capsule={c}
              onOpen={() => handleOpen(c)}
              onResolve={() => handleResolve(c)}
              resolving={resolvingId === c.id}
            />
          ))}
        </motion.div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="gilded flex flex-col items-center rounded-2xl px-6 py-16 text-center">
      <BookOpen className="size-8 text-gold flicker" />
      <p className="mt-4 font-display text-xl text-parchment">The archive is silent.</p>
      <p className="mt-2 max-w-md font-body italic text-muted-foreground">
        Be the first to inscribe a prophecy. The chain has memory enough for all.
      </p>
    </div>
  );
}

function ConfigBanner() {
  return (
    <div className="gilded rounded-2xl px-6 py-10 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember">
        ⚠ Contract address not configured
      </p>
      <p className="mt-3 font-display text-lg text-parchment">
        Set <code className="rounded bg-ink/60 px-2 py-0.5 font-mono text-sm text-gold">VITE_TIMECAPSULE_ADDRESS</code> in your environment.
      </p>
      <p className="mt-2 font-body italic text-muted-foreground">
        Then refresh, and the archive will awaken.
      </p>
    </div>
  );
}
