import { motion } from "framer-motion";

export function StarField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="starfield absolute inset-0" />
      <motion.div
        className="absolute -top-32 left-1/2 -translate-x-1/2 size-[700px] rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(circle, oklch(0.82 0.16 84 / 0.55) 0%, transparent 60%)",
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <Sigil className="absolute right-[-120px] top-[8%] size-[420px] opacity-[0.07] sigil-spin" />
      <Sigil className="absolute -left-32 bottom-[-120px] size-[480px] opacity-[0.05] sigil-spin" />
    </div>
  );
}

export function Sigil({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="0.6" className="text-gold">
        <circle cx="100" cy="100" r="98" />
        <circle cx="100" cy="100" r="78" />
        <circle cx="100" cy="100" r="58" />
        <circle cx="100" cy="100" r="32" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6;
          const x1 = 100 + Math.cos(a) * 32;
          const y1 = 100 + Math.sin(a) * 32;
          const x2 = 100 + Math.cos(a) * 98;
          const y2 = 100 + Math.sin(a) * 98;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
        <polygon points="100,30 159,135 41,135" />
        <polygon points="100,170 41,65 159,65" />
      </g>
    </svg>
  );
}
