export type Outcome = "TRUE" | "FALSE" | "UNRESOLVABLE" | "";

export interface Capsule {
  id: string;
  creator: string;
  prediction: string;
  resolution_hint: string;
  unlock_timestamp: number;
  created_at: number;
  resolved: boolean;
  outcome: Outcome;
  verdict_text: string;
  evidence_summary: string;
  confidence: number;
  resolved_at: number;
}

export interface RecentCapsule {
  id: string;
  creator: string;
  prediction: string;
  unlock_timestamp: number;
  resolved: boolean;
  outcome: Outcome;
}

export interface CreatorStats {
  total: number;
  resolved: number;
  truths: number;
  falsehoods: number;
  unresolvable: number;
}

export interface ProgressInfo {
  stage: "broadcasting" | "pending" | "finalized" | "error";
  message?: string;
  txHash?: string;
}

export type ProgressFn = (info: ProgressInfo) => void;
