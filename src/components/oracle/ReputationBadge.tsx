import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getCreatorStats } from "@/lib/genlayer";
import type { CreatorStats } from "@/lib/types";

export function ReputationBadge({
  address,
  refreshKey,
}: {
  address: string;
  refreshKey: number;
}) {
  const [stats, setStats] = useState<CreatorStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCreatorStats(address)
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [address, refreshKey]);

  if (!stats || stats.total === 0) return null;

  const winRate = stats.resolved > 0 ? Math.round((stats.truths / stats.resolved) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex flex-wrap items-center gap-x-4 gap-y-1 rounded-full border border-gold/30 bg-ink/40 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-gold-soft"
    >
      <span>✶ {stats.total} sealed</span>
      <span className="text-emerald-rune">✦ {stats.truths} truths</span>
      <span className="text-ember">✕ {stats.falsehoods} false</span>
      {stats.unresolvable > 0 && (
        <span className="text-smoke">⌬ {stats.unresolvable}</span>
      )}
      {stats.resolved > 0 && (
        <span className="text-gold">winrate · {winRate}%</span>
      )}
    </motion.div>
  );
}
