import type { Outcome } from "@/lib/types";

const map: Record<Exclude<Outcome, "">, { label: string; cls: string }> = {
  TRUE: {
    label: "✦ Truth",
    cls: "border-emerald-rune/60 bg-emerald-rune/10 text-emerald-rune",
  },
  FALSE: {
    label: "✕ Falsehood",
    cls: "border-ember/60 bg-ember/10 text-ember",
  },
  UNRESOLVABLE: {
    label: "⌬ Unresolvable",
    cls: "border-smoke/60 bg-smoke/10 text-smoke",
  },
};

export function StatusPill({
  outcome,
  resolved,
  ready,
}: {
  outcome: Outcome;
  resolved: boolean;
  ready: boolean;
}) {
  if (resolved && outcome) {
    const m = map[outcome];
    return (
      <span
        className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] ${m.cls}`}
      >
        {m.label}
      </span>
    );
  }
  if (ready) {
    return (
      <span className="inline-flex items-center rounded-full border border-gold/60 bg-gold/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-gold pulse-rune">
        ◆ awaiting verdict
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-gold-soft/40 bg-ink/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-gold-soft">
      ✶ sealed
    </span>
  );
}
