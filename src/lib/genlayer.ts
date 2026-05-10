import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet, testnetAsimov, localnet } from "genlayer-js/chains";
import type {
  Capsule,
  RecentCapsule,
  CreatorStats,
  ProgressFn,
  Outcome,
} from "./types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CONTRACT_ADDRESS = (import.meta.env.VITE_TIMECAPSULE_ADDRESS ?? "") as `0x${string}` | "";
const NETWORK = (import.meta.env.VITE_GENLAYER_NETWORK ?? "studionet") as
  | "studionet"
  | "testnetAsimov"
  | "localnet";

const CHAIN = NETWORK === "testnetAsimov" ? testnetAsimov : NETWORK === "localnet" ? localnet : studionet;

const RPC_URL: string =
  (CHAIN as { rpcUrls?: { default?: { http?: readonly string[] } } }).rpcUrls?.default?.http?.[0] ??
  "https://studio.genlayer.com/api";

export function isContractConfigured(): boolean {
  return CONTRACT_ADDRESS.startsWith("0x") && CONTRACT_ADDRESS.length === 42;
}

export function networkInfo() {
  return {
    name: NETWORK,
    contract: CONTRACT_ADDRESS,
    chainName: (CHAIN as { name?: string }).name ?? NETWORK,
  };
}

// ---------------------------------------------------------------------------
// Wallet (burner or MetaMask)
// ---------------------------------------------------------------------------

export type WalletChoice = "burner" | "metamask";

const PK_KEY = "timecapsule.burner.pk";
const CHOICE_KEY = "timecapsule.wallet.choice";

function loadBurnerPk(): `0x${string}` {
  if (typeof window === "undefined") return generatePrivateKey();
  const existing = window.localStorage.getItem(PK_KEY) as `0x${string}` | null;
  if (existing && existing.startsWith("0x")) return existing;
  const fresh = generatePrivateKey();
  window.localStorage.setItem(PK_KEY, fresh);
  return fresh;
}

export function rotateBurner(): string {
  if (typeof window === "undefined") return "";
  const fresh = generatePrivateKey();
  window.localStorage.setItem(PK_KEY, fresh);
  cachedAccount = null;
  cachedClient = null;
  connected = false;
  metamaskAddress = null;
  return fresh;
}

let cachedAccount: ReturnType<typeof createAccount> | null = null;
let cachedClient: ReturnType<typeof createClient> | null = null;
let connected = false;
let walletChoice: WalletChoice = "burner";
let metamaskAddress: `0x${string}` | null = null;

function getBurnerAccount() {
  if (!cachedAccount) cachedAccount = createAccount(loadBurnerPk());
  return cachedAccount;
}

interface EthProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...a: unknown[]) => void) => void;
}

function getEthereum(): EthProvider | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ethereum?: EthProvider }).ethereum ?? null;
}

async function ensureMetamaskChain(eth: EthProvider) {
  const chainId = (CHAIN as { id: number }).id;
  const hexId = "0x" + chainId.toString(16);
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: hexId,
            chainName: (CHAIN as { name?: string }).name ?? "GenLayer",
            rpcUrls: [RPC_URL],
            nativeCurrency: (CHAIN as { nativeCurrency?: unknown }).nativeCurrency ?? {
              name: "GEN",
              symbol: "GEN",
              decimals: 18,
            },
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

function getClient() {
  if (cachedClient) return cachedClient;
  if (walletChoice === "metamask" && metamaskAddress) {
    const eth = getEthereum();
    if (!eth) throw new Error("MetaMask not detected");
    cachedClient = createClient({
      chain: CHAIN,
      account: metamaskAddress,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      provider: eth as any,
    });
  } else {
    cachedClient = createClient({ chain: CHAIN, account: getBurnerAccount() });
  }
  return cachedClient;
}

// ---------------------------------------------------------------------------
// Wallet API
// ---------------------------------------------------------------------------

export async function initChain(): Promise<void> {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(CHOICE_KEY);
    if (stored === "burner" || stored === "metamask") walletChoice = stored;
  }
  // touching client ensures it's instantiated client-side
  if (walletChoice === "burner") getClient();
}

export async function connectWallet(choice: WalletChoice = walletChoice): Promise<string> {
  if (choice === "metamask") {
    const eth = getEthereum();
    if (!eth) throw new Error("MetaMask not found. Install the extension first.");
    await ensureMetamaskChain(eth);
    const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
    if (!accounts?.length) throw new Error("No MetaMask account selected");
    metamaskAddress = accounts[0] as `0x${string}`;
    walletChoice = "metamask";
    cachedClient = null;
    connected = true;
    if (typeof window !== "undefined") window.localStorage.setItem(CHOICE_KEY, "metamask");
    getClient();
    return metamaskAddress;
  }
  // burner
  walletChoice = "burner";
  cachedClient = null;
  const acc = getBurnerAccount();
  connected = true;
  if (typeof window !== "undefined") window.localStorage.setItem(CHOICE_KEY, "burner");
  getClient();
  return acc.address;
}

export function disconnect(): void {
  connected = false;
  metamaskAddress = null;
  cachedClient = null;
}

export function getConnectedAddress(): string | null {
  if (!connected) return null;
  if (walletChoice === "metamask") return metamaskAddress;
  return getBurnerAccount().address;
}

export function getWalletChoice(): WalletChoice {
  return walletChoice;
}

export function setWalletChoice(choice: WalletChoice): void {
  walletChoice = choice;
  cachedClient = null;
  if (typeof window !== "undefined") window.localStorage.setItem(CHOICE_KEY, choice);
}

export function shortAddr(addr: string | null | undefined): string {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function explorerAddr(addr: string): string {
  const base = (CHAIN as { blockExplorers?: { default?: { url?: string } } })
    .blockExplorers?.default?.url;
  return base ? `${base.replace(/\/$/, "")}/address/${addr}` : "#";
}

export function explorerTxUrl(hash: string): string {
  const base = (CHAIN as { blockExplorers?: { default?: { url?: string } } })
    .blockExplorers?.default?.url;
  return base ? `${base.replace(/\/$/, "")}/tx/${hash}` : "#";
}

// ---------------------------------------------------------------------------
// Capsule decoding helpers
// ---------------------------------------------------------------------------

function asString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return String(v);
}

function asNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "string") return Number(v) || 0;
  return 0;
}

function asBool(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === 1n;
}

function asOutcome(v: unknown): Outcome {
  const s = asString(v).toUpperCase();
  if (s === "TRUE" || s === "FALSE" || s === "UNRESOLVABLE") return s;
  return "";
}

function decodeCapsule(raw: unknown): Capsule {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: asString(r.id ?? r.capsule_id),
    creator: asString(r.creator),
    prediction: asString(r.prediction),
    resolution_hint: asString(r.resolution_hint),
    unlock_timestamp: asNumber(r.unlock_timestamp),
    created_at: asNumber(r.created_at),
    resolved: asBool(r.resolved),
    outcome: asOutcome(r.outcome),
    verdict_text: asString(r.verdict_text),
    evidence_summary: asString(r.evidence_summary),
    confidence: asNumber(r.confidence),
    resolved_at: asNumber(r.resolved_at),
  };
}

function decodeRecent(raw: unknown): RecentCapsule {
  const c = decodeCapsule(raw);
  return {
    id: c.id,
    creator: c.creator,
    prediction: c.prediction,
    unlock_timestamp: c.unlock_timestamp,
    resolved: c.resolved,
    outcome: c.outcome,
  };
}

// ---------------------------------------------------------------------------
// Contract calls
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Fast-path: peek at leader_receipt while tx is still PENDING/COMMITTING
// to extract the LLM verdict JSON before consensus formally accepts.
// Pattern ported from Trevor00s/CodeReview.
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function rpc(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
  });
  if (!res.ok) throw new Error(`RPC ${method} HTTP ${res.status}`);
  const json = (await res.json()) as { result?: unknown; error?: { message?: string } };
  if (json.error) throw new Error(`RPC ${method}: ${json.error.message ?? "unknown"}`);
  return json.result;
}

async function fetchTx(txHash: string): Promise<unknown> {
  const methods = [
    "gen_getTransactionByHash",
    "sim_getTransactionByHash",
    "eth_getTransactionByHash",
  ];
  for (const m of methods) {
    try {
      const r = await rpc(m, [txHash]);
      if (r) return r;
    } catch {
      /* try next */
    }
  }
  return null;
}

function getPath(obj: unknown, path: (string | number)[]): unknown {
  let cur: unknown = obj;
  for (const p of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string | number, unknown>)[p];
  }
  return cur;
}

function extractEqOutput(tx: unknown): string | null {
  if (!tx) return null;
  const candidates: (string | number)[][] = [
    ["consensus_data", "leader_receipt", 0, "eq_outputs", "0"],
    ["consensus_data", "leader_receipt", 0, "eq_outputs", 0],
    ["consensus_data", "leader_receipt", "eq_outputs", "0"],
    ["leader_receipt", "eq_outputs", "0"],
    ["eq_outputs", "0"],
    ["eq_outputs", 0],
  ];
  for (const c of candidates) {
    const v = getPath(tx, c);
    if (typeof v === "string" && v.length > 4) return v;
  }
  // Deep-scan fallback for the first long string in the response.
  let found: string | null = null;
  const visit = (node: unknown) => {
    if (found || node == null) return;
    if (typeof node === "string") {
      if (node.length > 50) found = node;
      return;
    }
    if (typeof node !== "object") return;
    for (const k of Object.keys(node as Record<string, unknown>)) {
      visit((node as Record<string, unknown>)[k]);
      if (found) return;
    }
  };
  visit(tx);
  return found;
}

function b64decode(s: string): string {
  try {
    const bin = atob(s);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return s;
  }
}

function findJsonObject(text: string, key: string): string | null {
  const idx = text.indexOf(`"${key}"`);
  if (idx < 0) return null;
  let start = idx;
  while (start >= 0 && text[start] !== "{") start--;
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

const VERDICT_KEYS = ["outcome", "verdict_text", "evidence_summary", "confidence"];

function parseVerdictEqOutput(eqOutput: string): {
  outcome: Outcome;
  verdict_text: string;
  evidence_summary: string;
  confidence: number;
  resolved_at: number;
} | null {
  if (!eqOutput) return null;
  let text = eqOutput;
  const decoded = b64decode(eqOutput);
  if (decoded && VERDICT_KEYS.some((k) => decoded.includes(k))) text = decoded;
  else if (VERDICT_KEYS.some((k) => eqOutput.includes(k))) text = eqOutput;
  else text = decoded || eqOutput;

  let json: string | null = null;
  for (const k of VERDICT_KEYS) {
    json = findJsonObject(text, k);
    if (json) break;
  }
  if (!json) return null;
  try {
    const o = JSON.parse(json) as Record<string, unknown>;
    const outcomeRaw = String(o.outcome ?? "").toUpperCase().trim();
    const outcome: Outcome =
      outcomeRaw === "TRUE" || outcomeRaw === "FALSE" || outcomeRaw === "UNRESOLVABLE"
        ? outcomeRaw
        : "";
    const conf = Math.max(0, Math.min(100, Number(o.confidence ?? 0) | 0));
    return {
      outcome,
      verdict_text: String(o.verdict_text ?? ""),
      evidence_summary: String(o.evidence_summary ?? ""),
      confidence: conf,
      resolved_at: Number(o._now ?? Math.floor(Date.now() / 1000)),
    };
  } catch {
    return null;
  }
}

async function pollTxForEqOutput(
  txHash: string,
  onProgress?: ProgressFn,
): Promise<string> {
  const max = 90;
  for (let i = 0; i < max; i++) {
    await sleep(2000);
    const tx = await fetchTx(txHash);
    const eq = extractEqOutput(tx);
    if (eq) return eq;
    if (i % 3 === 0) {
      const status = (tx as { status?: string; tx_status?: string } | null)?.status
        || (tx as { status?: string; tx_status?: string } | null)?.tx_status
        || "pending";
      onProgress?.({
        stage: "pending",
        message: `${status} · ${i * 2}s elapsed`,
        txHash,
      });
    }
  }
  throw new Error("Timeout: validator output did not appear on-chain.");
}

function ensureContract(): `0x${string}` {
  if (!isContractConfigured()) {
    throw new Error(
      "TimeCapsule contract address is not configured. Set VITE_TIMECAPSULE_ADDRESS in your environment."
    );
  }
  return CONTRACT_ADDRESS as `0x${string}`;
}

export async function createCapsule(
  prediction: string,
  hint: string,
  unlockTs: number,
  onProgress?: ProgressFn
): Promise<Capsule> {
  const address = ensureContract();
  const client = getClient();

  onProgress?.({ stage: "broadcasting", message: "Sealing the prophecy…" });
  const txHash = await client.writeContract({
    address,
    functionName: "create_capsule",
    args: [prediction, hint, BigInt(unlockTs)],
    value: 0n,
  });

  console.log("[createCapsule] tx submitted:", txHash);
  onProgress?.({ stage: "pending", message: "Awaiting consensus…", txHash });

  // Wait for the leader's eq_output to appear — this happens BEFORE the
  // tx is fully accepted, so the UI feels instant.
  const eqOut = await pollTxForEqOutput(txHash, onProgress);
  console.log("[createCapsule] eq_output:", eqOut);
  // Also fetch the full tx to inspect status / errors.
  const fullTx = await fetchTx(txHash);
  console.log("[createCapsule] full tx:", fullTx);

  // Storage on Studio lags behind eq_output (state mutation only commits at
  // ACCEPTED). Build the Capsule from the inputs we already have so the
  // reveal is instant; storage will catch up for the archive list.
  let newId = "0";
  try {
    const total = await getTotalCapsules();
    newId = String(Math.max(0, total - 1));
  } catch {
    /* ignore — best-effort id */
  }

  const sender = getConnectedAddress() ?? "";
  onProgress?.({ stage: "finalized", message: "Sealed.", txHash });
  return {
    id: newId,
    creator: sender,
    prediction,
    resolution_hint: hint,
    unlock_timestamp: unlockTs,
    created_at: Math.floor(Date.now() / 1000),
    resolved: false,
    outcome: "",
    verdict_text: "",
    evidence_summary: "",
    confidence: 0,
    resolved_at: 0,
  };
}

export async function resolveCapsule(
  capsuleId: string,
  onProgress?: ProgressFn
): Promise<Capsule> {
  const address = ensureContract();
  const client = getClient();

  onProgress?.({ stage: "broadcasting", message: "Summoning validators…" });
  const txHash = await client.writeContract({
    address,
    functionName: "resolve_capsule",
    args: [capsuleId],
    value: 0n,
  });

  onProgress?.({ stage: "pending", message: "The oracles deliberate…", txHash });

  // Fast-path: as soon as the leader's eq_output appears, parse the verdict
  // JSON directly from the calldata. Don't wait for full ACCEPTED status.
  const eqOutput = await pollTxForEqOutput(txHash, onProgress);
  const peeked = parseVerdictEqOutput(eqOutput);

  // Try to enrich from storage (may not be populated yet on Studio).
  let stored: Capsule | null = null;
  try {
    stored = await getCapsule(capsuleId);
  } catch {
    /* storage may not be ready; rely on peeked */
  }

  onProgress?.({ stage: "finalized", message: "Verdict revealed.", txHash });

  // Merge: peeked (live LLM output) wins for verdict fields, storage fills the rest.
  if (stored && stored.resolved && stored.outcome) {
    return stored;
  }
  if (peeked) {
    const base = stored ?? (await getCapsule(capsuleId).catch(() => null));
    return {
      id: capsuleId,
      creator: base?.creator ?? "",
      prediction: base?.prediction ?? "",
      resolution_hint: base?.resolution_hint ?? "",
      unlock_timestamp: base?.unlock_timestamp ?? 0,
      created_at: base?.created_at ?? 0,
      resolved: true,
      outcome: peeked.outcome,
      verdict_text: peeked.verdict_text,
      evidence_summary: peeked.evidence_summary,
      confidence: peeked.confidence,
      resolved_at: peeked.resolved_at,
    };
  }
  if (stored) return stored;
  throw new Error("Could not extract verdict from transaction.");
}

export async function getCapsule(id: string): Promise<Capsule> {
  const address = ensureContract();
  const client = getClient();
  const raw = await client.readContract({
    address,
    functionName: "get_capsule",
    args: [id],
  });
  return decodeCapsule(raw);
}

export async function getTotalCapsules(): Promise<number> {
  const address = ensureContract();
  const client = getClient();
  const raw = await client.readContract({
    address,
    functionName: "get_total_capsules",
    args: [],
  });
  console.log("[getTotalCapsules] raw =", raw);
  return asNumber(raw);
}

export async function getRecentCapsules(limit = 12): Promise<RecentCapsule[]> {
  const address = ensureContract();
  const client = getClient();
  const raw = await client.readContract({
    address,
    functionName: "get_recent_capsules",
    args: [BigInt(limit)],
  });
  console.log("[getRecentCapsules] raw =", raw);
  if (!Array.isArray(raw)) return [];
  return raw.map(decodeRecent);
}

export async function getCreatorStats(addr: string): Promise<CreatorStats> {
  const address = ensureContract();
  const client = getClient();
  const raw = await client.readContract({
    address,
    functionName: "get_creator_stats",
    args: [addr],
  });
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    total: asNumber(r.total),
    resolved: asNumber(r.resolved),
    truths: asNumber(r.truths ?? r.true_count),
    falsehoods: asNumber(r.falsehoods ?? r.false_count),
    unresolvable: asNumber(r.unresolvable ?? r.unresolvable_count),
  };
}
