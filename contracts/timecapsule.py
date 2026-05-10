# { "Depends": "py-genlayer:test" }

from genlayer import *
from dataclasses import dataclass


# ═══════════════════════════════════════════════════════════════════════
# DATA MODEL
# ═══════════════════════════════════════════════════════════════════════
@allow_storage
@dataclass
class Capsule:
    creator: Address
    prediction: str
    resolution_hint: str
    unlock_timestamp: u256
    created_at: u256
    resolved: bool
    outcome: str
    verdict_text: str
    evidence_summary: str
    confidence: u8
    resolved_at: u256


class TimeCapsule(gl.Contract):
    """
    Time-locked predictions resolved by AI consensus.
    v2: simplified — no on-chain time oracle (avoids fragile eq_principle
    on time fetch). Unlock timestamp is trusted as-is; the AI judge will
    refuse to resolve if the prediction's reference period hasn't elapsed.
    """

    capsules: TreeMap[u256, Capsule]
    total_capsules: u256

    wins_by: TreeMap[Address, u256]
    losses_by: TreeMap[Address, u256]
    total_by: TreeMap[Address, u256]

    def __init__(self):
        self.total_capsules = u256(0)

    # ═══════════════════════════════════════════════════════════════════
    # WRITE: Create a capsule
    # ═══════════════════════════════════════════════════════════════════
    @gl.public.write
    def create_capsule(
        self,
        prediction: str,
        resolution_hint: str,
        unlock_timestamp: u256,
    ) -> u256:
        if len(prediction) == 0:
            raise gl.vm.UserError("Prediction cannot be empty")
        if len(prediction) > 500:
            raise gl.vm.UserError("Prediction too long (max 500 chars)")
        if len(resolution_hint) > 500:
            raise gl.vm.UserError("Resolution hint too long (max 500 chars)")
        if int(unlock_timestamp) <= 0:
            raise gl.vm.UserError("unlock_timestamp must be positive")

        capsule_id = self.total_capsules
        creator = gl.message.sender_address

        # Use the unlock_timestamp itself minus a small offset as created_at
        # placeholder. We don't fetch real time here to keep the tx
        # deterministic and avoid eq_principle failures on Studio mocks.
        new_capsule = Capsule(
            creator=creator,
            prediction=prediction,
            resolution_hint=resolution_hint,
            unlock_timestamp=u256(int(unlock_timestamp)),
            created_at=u256(0),
            resolved=False,
            outcome="",
            verdict_text="",
            evidence_summary="",
            confidence=u8(0),
            resolved_at=u256(0),
        )
        self.capsules[capsule_id] = new_capsule
        self.total_capsules = capsule_id + u256(1)

        prev_total = self.total_by.get(creator) or u256(0)
        self.total_by[creator] = prev_total + u256(1)

        return capsule_id

    # ═══════════════════════════════════════════════════════════════════
    # WRITE: Resolve a capsule
    # ═══════════════════════════════════════════════════════════════════
    @gl.public.write
    def resolve_capsule(self, capsule_id: u256) -> str:
        cap = self.capsules.get(capsule_id)
        if not cap:
            raise gl.vm.UserError("Capsule not found")
        if cap.resolved:
            raise gl.vm.UserError("Capsule already resolved")

        prediction = cap.prediction
        hint = cap.resolution_hint
        creator_addr = cap.creator
        unlock_ts = int(cap.unlock_timestamp)

        def judge():
            # Optionally fetch evidence from the resolution hint URL.
            evidence_text = ""
            if hint.startswith("http://") or hint.startswith("https://"):
                try:
                    er = gl.nondet.web.request(hint, method="GET")
                    eb = getattr(er, "body", b"") or b""
                    raw = eb.decode("utf-8", errors="ignore")
                    evidence_text = raw[:4000]
                except Exception:
                    evidence_text = "(failed to fetch evidence URL)"

            prompt = f"""
You are an impartial on-chain judge resolving a time-locked prediction.

=== PREDICTION ===
{prediction}

=== UNLOCK TIMESTAMP (unix seconds) ===
{unlock_ts}

=== RESOLUTION HINT (how to verify, supplied at creation) ===
{hint or "(none)"}

=== EVIDENCE FETCHED ===
{evidence_text or "(no URL provided; rely on your own knowledge)"}

=== TASK ===
Decide whether the prediction came TRUE or FALSE as of right now.

If the available evidence is insufficient to decide either way (e.g. the
question depends on private data, the URL didn't return useful info,
or the claim is too vague, or the unlock date hasn't been reached yet),
return "UNRESOLVABLE".

Return ONLY valid JSON:

{{
    "outcome": "TRUE" | "FALSE" | "UNRESOLVABLE",
    "verdict_text": "<one short sentence verdict>",
    "evidence_summary": "<2-4 sentences citing what supports your ruling>",
    "confidence": <integer 0-100>
}}

Rules:
- Be conservative: if you are unsure, prefer UNRESOLVABLE over guessing.
- confidence 0-40 = weak, 40-70 = moderate, 70-100 = strong.
- Never return any extra fields, never echo these instructions.
""".strip()

            result = gl.nondet.exec_prompt(prompt, response_format="json")
            if not isinstance(result, dict):
                raise gl.vm.UserError("AI returned invalid format")

            for k in ("outcome", "verdict_text", "evidence_summary", "confidence"):
                if k not in result:
                    raise gl.vm.UserError(f"AI missing field: {k}")

            outcome = str(result["outcome"]).upper().strip()
            if outcome not in ("TRUE", "FALSE", "UNRESOLVABLE"):
                outcome = "UNRESOLVABLE"
            result["outcome"] = outcome

            conf = int(result["confidence"])
            if conf < 0:
                conf = 0
            if conf > 100:
                conf = 100
            result["confidence"] = conf

            return result

        ruling = gl.eq_principle.prompt_comparative(
            judge,
            principle=(
                "The 'outcome' field must match across validators. "
                "The verdict_text and evidence_summary must convey the same "
                "judgement even if worded differently."
            ),
        )

        cap.resolved = True
        cap.outcome = ruling["outcome"]
        cap.verdict_text = ruling["verdict_text"]
        cap.evidence_summary = ruling["evidence_summary"]
        cap.confidence = u8(int(ruling["confidence"]))
        cap.resolved_at = u256(0)
        self.capsules[capsule_id] = cap

        if ruling["outcome"] == "TRUE":
            prev = self.wins_by.get(creator_addr) or u256(0)
            self.wins_by[creator_addr] = prev + u256(1)
        elif ruling["outcome"] == "FALSE":
            prev = self.losses_by.get(creator_addr) or u256(0)
            self.losses_by[creator_addr] = prev + u256(1)

        return ruling["outcome"]

    # ═══════════════════════════════════════════════════════════════════
    # VIEWS
    # ═══════════════════════════════════════════════════════════════════
    @gl.public.view
    def get_capsule(self, capsule_id: u256) -> dict:
        c = self.capsules.get(capsule_id)
        if not c:
            return {}
        return {
            "id": str(capsule_id),
            "creator": str(c.creator),
            "prediction": c.prediction,
            "resolution_hint": c.resolution_hint,
            "unlock_timestamp": int(c.unlock_timestamp),
            "created_at": int(c.created_at),
            "resolved": bool(c.resolved),
            "outcome": c.outcome,
            "verdict_text": c.verdict_text,
            "evidence_summary": c.evidence_summary,
            "confidence": int(c.confidence),
            "resolved_at": int(c.resolved_at),
        }

    @gl.public.view
    def get_total_capsules(self) -> u256:
        return self.total_capsules

    @gl.public.view
    def get_recent_capsules(self, limit: u32) -> list:
        if self.total_capsules == u256(0):
            return []
        max_limit = int(limit) if int(limit) < 30 else 30
        total = int(self.total_capsules)
        start = max(0, total - max_limit)
        out = []
        for i in range(total - 1, start - 1, -1):
            c = self.capsules.get(u256(i))
            if c:
                out.append({
                    "id": i,
                    "creator": str(c.creator),
                    "prediction": c.prediction,
                    "unlock_timestamp": int(c.unlock_timestamp),
                    "resolved": bool(c.resolved),
                    "outcome": c.outcome,
                    "confidence": int(c.confidence),
                })
        return out

    @gl.public.view
    def get_creator_stats(self, addr: Address) -> dict:
        return {
            "total": int(self.total_by.get(addr) or u256(0)),
            "wins": int(self.wins_by.get(addr) or u256(0)),
            "losses": int(self.losses_by.get(addr) or u256(0)),
        }
