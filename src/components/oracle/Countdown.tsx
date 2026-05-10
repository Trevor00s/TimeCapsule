import { useEffect, useState } from "react";

function fmt(ms: number): { label: string; tense: boolean } {
  if (ms <= 0) return { label: "the hour has come", tense: true };
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return { label: `${d}d ${h}h ${m}m`, tense: d < 1 };
  if (h > 0) return { label: `${h}h ${m}m ${sec}s`, tense: h < 1 };
  if (m > 0) return { label: `${m}m ${sec}s`, tense: m < 5 };
  return { label: `${sec}s`, tense: true };
}

export function Countdown({ unlockTs, prefix = "unseals in" }: { unlockTs: number; prefix?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = unlockTs * 1000 - now;
  const { label, tense } = fmt(ms);
  if (ms <= 0) {
    return (
      <span className="font-mono text-xs uppercase tracking-[0.25em] text-emerald-rune">
        ◆ ready to resolve
      </span>
    );
  }
  return (
    <span
      className={`font-mono text-xs uppercase tracking-[0.25em] ${
        tense ? "text-ember flicker" : "text-gold-soft"
      }`}
    >
      {prefix} · {label}
    </span>
  );
}
