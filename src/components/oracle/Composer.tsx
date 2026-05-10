import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Feather, Link2, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";
import { createCapsule, isContractConfigured } from "@/lib/genlayer";
import type { Capsule, ProgressInfo } from "@/lib/types";

const SAMPLES = [
  {
    label: "BTC > $200k",
    prediction:
      "BTC closes above $200,000 USD on CoinGecko by Dec 31, 2026.",
    hint: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
  },
  {
    label: "GPT-5",
    prediction: "OpenAI publicly releases GPT-5 before the unlock date.",
    hint: "https://openai.com/news",
  },
  {
    label: "GenLayer 10k ⭐",
    prediction:
      "The genlayer-studio repo reaches 10,000 GitHub stars by the unlock date.",
    hint: "https://api.github.com/repos/genlayerlabs/genlayer-studio",
  },
];

const QUICKS: { label: string; secs: number }[] = [
  { label: "+1m", secs: 60 },
  { label: "+1h", secs: 3600 },
  { label: "+1d", secs: 86400 },
  { label: "+1w", secs: 604800 },
  { label: "+1mo", secs: 2592000 },
  { label: "+1y", secs: 31536000 },
];

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function Composer({
  connected,
  onSealed,
}: {
  connected: boolean;
  onSealed: (c: Capsule) => void;
}) {
  const [prediction, setPrediction] = useState("");
  const [hint, setHint] = useState("");
  const [unlock, setUnlock] = useState(() =>
    toLocalInput(new Date(Date.now() + 60_000))
  );
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [busy, setBusy] = useState(false);

  const unlockTs = useMemo(() => {
    const d = new Date(unlock);
    return Math.floor(d.getTime() / 1000);
  }, [unlock]);

  const valid =
    prediction.trim().length > 0 &&
    prediction.length <= 500 &&
    hint.length <= 500 &&
    unlockTs * 1000 > Date.now() + 30_000;

  function quick(secs: number) {
    setUnlock(toLocalInput(new Date(Date.now() + secs * 1000)));
  }

  function applySample(s: (typeof SAMPLES)[number]) {
    setPrediction(s.prediction);
    setHint(s.hint);
    if (unlockTs * 1000 < Date.now() + 86_400_000) quick(86400 * 30);
  }

  async function handleSeal() {
    if (!connected) return toast.error("Enter the chamber first.");
    if (!isContractConfigured())
      return toast.error("Contract address missing", {
        description: "Set VITE_TIMECAPSULE_ADDRESS to wire the chain.",
      });
    if (!valid) return toast.error("The prophecy is malformed.");

    try {
      setBusy(true);
      const cap = await createCapsule(
        prediction.trim(),
        hint.trim(),
        unlockTs,
        (p) => setProgress(p)
      );
      onSealed(cap);
      toast.success("Sealed.", { description: `Capsule #${cap.id}` });
      setPrediction("");
      setHint("");
    } catch (e) {
      toast.error("The seal would not hold", {
        description: (e as Error).message,
      });
      setProgress({ stage: "error", message: (e as Error).message });
    } finally {
      setBusy(false);
      setTimeout(() => setProgress(null), 2400);
    }
  }

  return (
    <section
      id="compose"
      className="relative gilded gilded-strong rounded-2xl p-6 sm:p-8"
    >
      <header className="mb-5 flex items-center gap-3">
        <Feather className="size-4 text-gold" />
        <h2 className="font-display text-lg uppercase tracking-[0.3em] text-gold">
          Inscribe a Prophecy
        </h2>
      </header>

      <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-gold-soft">
        ✦ The prediction
      </label>
      <textarea
        value={prediction}
        onChange={(e) => setPrediction(e.target.value.slice(0, 500))}
        placeholder="Speak the prophecy. The chain shall remember it word for word."
        rows={3}
        className="w-full resize-none rounded-lg border border-border bg-input/40 px-4 py-3 font-body text-lg leading-snug text-parchment placeholder:text-muted-foreground/60 focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
      />
      <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
        <span>{prediction.length}/500</span>
        <div className="flex flex-wrap gap-1">
          {SAMPLES.map((s) => (
            <button
              key={s.label}
              onClick={() => applySample(s)}
              className="rounded-full border border-border px-2 py-0.5 hover:border-gold/50 hover:text-gold"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <label className="mb-2 mt-5 block font-mono text-[10px] uppercase tracking-[0.3em] text-gold-soft">
        <Link2 className="mr-1 inline size-3" /> Resolution oracle (URL or note)
      </label>
      <input
        value={hint}
        onChange={(e) => setHint(e.target.value.slice(0, 500))}
        placeholder="https://… where the truth shall be sought"
        className="w-full rounded-lg border border-border bg-input/40 px-4 py-2.5 font-mono text-sm text-parchment placeholder:text-muted-foreground/60 focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
      />

      <label className="mb-2 mt-5 block font-mono text-[10px] uppercase tracking-[0.3em] text-gold-soft">
        ◴ The hour of unsealing
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="datetime-local"
          value={unlock}
          onChange={(e) => setUnlock(e.target.value)}
          className="rounded-lg border border-border bg-input/40 px-3 py-2 font-mono text-sm text-parchment focus:border-gold/60 focus:outline-none"
        />
        {QUICKS.map((q) => (
          <button
            key={q.label}
            onClick={() => quick(q.secs)}
            className="rounded-full border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-gold-soft hover:border-gold/60 hover:text-gold"
          >
            {q.label}
          </button>
        ))}
      </div>

      <div className="my-6 divider-rune" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-md font-body text-sm italic text-muted-foreground">
          Once sealed, the prophecy cannot be altered. When the hour strikes,
          any soul may summon the AI council to render judgment.
        </p>
        <button
          disabled={!valid || busy}
          onClick={handleSeal}
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-b from-gold to-gold-soft px-7 py-3 font-display text-sm uppercase tracking-[0.25em] text-primary-foreground shadow-lg shadow-gold/20 transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Lock className="size-4" />
          {busy ? "Sealing…" : "Seal the Prophecy"}
          <Sparkles className="size-4 opacity-70 transition group-hover:opacity-100" />
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </button>
      </div>

      <AnimatePresence>
        {progress && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4 rounded-lg border border-gold/40 bg-ink/60 px-4 py-2 font-mono text-xs text-gold flicker"
          >
            ◐ {progress.stage.toUpperCase()} · {progress.message}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
