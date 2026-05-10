import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import type { Capsule } from "@/lib/types";
import { shortAddr } from "@/lib/genlayer";

const VERDICT_STYLES: Record<string, { color: string; word: string; sigil: string }> = {
  TRUE: { color: "text-emerald-rune", word: "Truth", sigil: "✦" },
  FALSE: { color: "text-ember", word: "Falsehood", sigil: "✕" },
  UNRESOLVABLE: { color: "text-smoke", word: "Unresolvable", sigil: "⌬" },
};

export function VerdictReveal({
  capsule,
  onClose,
}: {
  capsule: Capsule | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {capsule && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink-deep/85 px-4 py-10 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 220 }}
            onClick={(e) => e.stopPropagation()}
            className="gilded gilded-strong relative w-full max-w-2xl overflow-hidden rounded-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-gold-soft hover:bg-accent/40 hover:text-gold"
            >
              <X className="size-4" />
            </button>

            {capsule.resolved && capsule.outcome ? (
              <ResolvedBody capsule={capsule} />
            ) : (
              <SealedBody capsule={capsule} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SealedBody({ capsule }: { capsule: Capsule }) {
  const ready = capsule.unlock_timestamp * 1000 <= Date.now();
  return (
    <div className="relative px-8 py-10 sm:px-12">
      <div className="absolute right-8 top-8 size-16 rounded-full seal-stamp candle-glow" />
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold-soft">
        ✶ Sealed Capsule · #{capsule.id}
      </p>
      <h2 className="mt-4 font-display text-2xl leading-snug text-parchment sm:text-3xl">
        “{capsule.prediction}”
      </h2>

      <div className="my-8 divider-rune" />

      <Field label="Inscribed by">{shortAddr(capsule.creator)}</Field>
      <Field label="Sealed at">
        {new Date(capsule.created_at * 1000).toUTCString()}
      </Field>
      <Field label="Unsealing hour">
        {new Date(capsule.unlock_timestamp * 1000).toUTCString()}
      </Field>
      {capsule.resolution_hint && (
        <Field label="Resolution oracle">
          <a
            href={capsule.resolution_hint}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 break-all text-gold hover:underline"
          >
            {capsule.resolution_hint}
            <ExternalLink className="size-3" />
          </a>
        </Field>
      )}

      <p className="mt-8 font-body italic text-muted-foreground">
        {ready
          ? "The hour has come. Any soul may summon the council."
          : "The prophecy slumbers. None, not even its author, may alter it."}
      </p>
    </div>
  );
}

function ResolvedBody({ capsule }: { capsule: Capsule }) {
  const v = VERDICT_STYLES[capsule.outcome] ?? VERDICT_STYLES.UNRESOLVABLE;
  return (
    <div className="relative px-8 py-10 sm:px-12">
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 14, stiffness: 180, delay: 0.15 }}
        className={`mx-auto mb-6 flex size-24 items-center justify-center rounded-full border-2 candle-glow ${v.color}`}
        style={{ borderColor: "currentColor" }}
      >
        <span className="font-display text-4xl">{v.sigil}</span>
      </motion.div>

      <p className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-gold-soft">
        Verdict · Capsule #{capsule.id}
      </p>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`mt-2 text-center font-display text-4xl uppercase tracking-[0.18em] ${v.color}`}
      >
        {v.word}
      </motion.h2>

      <motion.blockquote
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 border-l-2 border-gold/40 pl-4 font-display text-lg italic leading-snug text-parchment"
      >
        “{capsule.prediction}”
      </motion.blockquote>

      <div className="my-8 divider-rune" />

      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold-soft">
        ✦ The council speaks
      </p>
      <p className="mt-3 font-display text-xl leading-snug text-parchment">
        {capsule.verdict_text || "—"}
      </p>

      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-gold-soft">
        ◇ Evidence
      </p>
      <p className="mt-2 font-body text-sm leading-relaxed text-muted-foreground">
        {capsule.evidence_summary || "—"}
      </p>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-gold/30 bg-ink/40 px-4 py-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold-soft">
          Confidence
        </span>
        <div className="flex flex-1 items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink-deep">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${capsule.confidence}%` }}
              transition={{ duration: 1.2, delay: 0.7, ease: "easeOut" }}
              className={`h-full ${v.color}`}
              style={{ background: "currentColor" }}
            />
          </div>
          <span className={`font-mono text-sm ${v.color}`}>
            {Math.round(capsule.confidence)}%
          </span>
        </div>
      </div>

      <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Rendered {new Date(capsule.resolved_at * 1000).toUTCString()}
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 grid grid-cols-1 gap-1 sm:grid-cols-[180px_1fr]">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold-soft">
        {label}
      </span>
      <span className="font-mono text-sm text-parchment">{children}</span>
    </div>
  );
}
