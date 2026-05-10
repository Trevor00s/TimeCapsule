import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, LogOut, Copy, RotateCw, Flame, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  connectWallet,
  disconnect,
  getConnectedAddress,
  getWalletChoice,
  initChain,
  shortAddr,
  rotateBurner,
  networkInfo,
  type WalletChoice,
} from "@/lib/genlayer";

export function WalletPanel({
  address,
  onChange,
}: {
  address: string | null;
  onChange: (a: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [choice, setChoice] = useState<WalletChoice>("burner");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initChain().catch(() => {});
    setChoice(getWalletChoice());
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function handleConnect(c: WalletChoice) {
    setOpenMenu(false);
    try {
      setBusy(true);
      const addr = await connectWallet(c);
      setChoice(c);
      onChange(addr);
      toast.success("The chamber recognises you", {
        description: `${c === "metamask" ? "MetaMask" : "Burner"} · ${shortAddr(addr)}`,
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function handleDisconnect() {
    disconnect();
    onChange(null);
    toast("The veil falls again");
  }

  function handleRotate() {
    rotateBurner();
    const fresh = getConnectedAddress();
    onChange(fresh);
    toast("A new burner sigil minted");
  }

  function copyAddr() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    toast("Sigil copied");
  }

  const net = networkInfo();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-gold-soft sm:inline">
        ◇ {net.chainName}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        {address ? (
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1 rounded-full border border-gold/40 bg-ink/60 px-1 py-1 backdrop-blur"
          >
            <button
              onClick={copyAddr}
              className="flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-xs text-parchment hover:bg-accent/40"
              title="Copy address"
            >
              <span className="size-1.5 rounded-full bg-emerald-rune candle-glow" />
              {shortAddr(address)}
              <Copy className="size-3 opacity-60" />
            </button>
            {choice === "burner" && (
              <button
                onClick={handleRotate}
                className="rounded-full p-1.5 text-gold-soft hover:bg-accent/40 hover:text-gold"
                title="Mint new burner"
              >
                <RotateCw className="size-3.5" />
              </button>
            )}
            <button
              onClick={handleDisconnect}
              className="rounded-full p-1.5 text-gold-soft hover:bg-accent/40 hover:text-ember"
              title="Disconnect"
            >
              <LogOut className="size-3.5" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="connect"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            ref={menuRef}
            className="relative"
          >
            <button
              disabled={busy}
              onClick={() => setOpenMenu((o) => !o)}
              className="inline-flex items-center gap-2 rounded-full border border-gold/60 bg-gold/15 px-4 py-2 font-display text-sm text-gold transition hover:bg-gold/25 disabled:opacity-50"
            >
              <Wallet className="size-4" />
              {busy ? "Lighting the wick…" : "Enter the Chamber"}
              <ChevronDown className="size-3.5 opacity-70" />
            </button>
            <AnimatePresence>
              {openMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-xl border border-gold/40 bg-ink/95 p-1.5 shadow-2xl backdrop-blur"
                >
                  <button
                    onClick={() => handleConnect("burner")}
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-parchment transition hover:bg-gold/15"
                  >
                    <Flame className="mt-0.5 size-4 text-ember" />
                    <div className="flex-1">
                      <div className="font-display text-sm text-gold">Burner sigil</div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-gold-soft">
                        Auto-minted · zero setup
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleConnect("metamask")}
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-parchment transition hover:bg-gold/15"
                  >
                    <Wallet className="mt-0.5 size-4 text-emerald-rune" />
                    <div className="flex-1">
                      <div className="font-display text-sm text-gold">MetaMask</div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-gold-soft">
                        Bring your own wallet
                      </div>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
