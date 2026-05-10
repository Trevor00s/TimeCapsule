import { motion } from "framer-motion";
import { ScrollText } from "lucide-react";
import type { Capsule, RecentCapsule } from "@/lib/types";
import { shortAddr } from "@/lib/genlayer";
import { Countdown } from "./Countdown";
import { StatusPill } from "./StatusPill";

export function CapsuleCard({
  capsule,
  onOpen,
  onResolve,
  resolving = false,
}: {
  capsule: Capsule | RecentCapsule;
  onOpen: () => void;
  onResolve?: () => void;
  resolving?: boolean;
}) {
  const ready = !capsule.resolved && capsule.unlock_timestamp * 1000 <= Date.now();
  const cap = capsule as Capsule;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className="group gilded relative flex flex-col overflow-hidden rounded-xl p-5 cursor-pointer"
      onClick={onOpen}
    >
      <div
        className={`absolute -right-10 -top-10 size-32 rounded-full opacity-30 transition group-hover:opacity-60 ${
          capsule.resolved && capsule.outcome === "TRUE"
            ? "bg-emerald-rune"
            : capsule.resolved && capsule.outcome === "FALSE"
            ? "bg-ember"
            : capsule.resolved
            ? "bg-smoke"
            : "bg-gold"
        } blur-3xl`}
      />

      <div className="relative flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold-soft">
          ✶ Capsule #{capsule.id}
        </span>
        <StatusPill
          outcome={capsule.outcome}
          resolved={capsule.resolved}
          ready={ready}
        />
      </div>

      <p className="relative mt-4 line-clamp-4 font-display text-base leading-snug text-parchment">
        “{capsule.prediction}”
      </p>

      <div className="relative mt-auto flex items-center justify-between gap-3 pt-5 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        <span>by {shortAddr(capsule.creator)}</span>
        {capsule.resolved ? (
          <span className="text-gold-soft">
            confidence · {Math.round(cap.confidence ?? 0)}%
          </span>
        ) : (
          <Countdown unlockTs={capsule.unlock_timestamp} />
        )}
      </div>

      {ready && onResolve && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onResolve();
          }}
          disabled={resolving}
          className="relative mt-4 w-full rounded-full border border-gold/60 bg-gold/15 py-2 font-display text-xs uppercase tracking-[0.3em] text-gold transition hover:bg-gold/30 disabled:opacity-50"
        >
          {resolving ? "Summoning council…" : "✦ Summon the Verdict"}
        </button>
      )}

      {capsule.resolved && (
        <div className="relative mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-gold-soft">
          <ScrollText className="size-3" />
          read the verdict
        </div>
      )}
    </motion.article>
  );
}
