# Consumer Knowledge Evolution — Three-Role Roadmap Review 2026-08-11

Status: `ROADMAP_DESIGN_REVIEW_RECORD`
Implementation authorization: `NONE`

## Roles

### Platform Architect
Focus: common architecture, private-Git canonical authority, portability, schema stability, avoidance of duplicate ingestion engines.

### Product Delivery Lead
Focus: immediate value from already-running BAI VIDEO PRODUCTION and minimizing the period in which useful knowledge is lost.

### Critic / Cost & Governance
Focus: <=3,000 JPY/month infrastructure, privacy/secrets, minimum sufficient governance, avoiding premature cloud complexity and false automated authority.

## Round 1 — What must be first?

Platform Architect: contracts must precede infrastructure, but ZIP intake can be a formal source adapter.

Product Delivery Lead: Pattern C must be first because BAI VIDEO PRODUCTION is active now; waiting for a Hub loses evidence.

Critic: agree; Hub-first adds cost and attack surface before proving the Knowledge contract.

Decision: `Pattern C first`.

## Round 2 — Is Pattern C throwaway/manual glue?

Platform Architect: no; it must produce the same Evidence/Candidate shapes as future A/B.

Product Delivery Lead: it must also accept ordinary manifestless ZIPs because current projects were not built with the future manifest.

Critic: raw ZIPs/secrets must never become Canonical repository content.

Decision: Pattern C is first-class and common-contract-driven.

## Round 3 — What about A/B sequencing and future roadmap?

Platform Architect: Pattern A next because it solves cross-repository/private-repository transport; Pattern B only after Common Ingestion Core stabilizes.

Product Delivery Lead: Pattern C already covers local/manual cases, so B adds little immediate value.

Critic: Pattern A must stay one-VPS/PostgreSQL within 3,000 JPY/month; no Kafka/Kubernetes/managed DB/vector DB by default. Future TASK numbering should wait for actual bottlenecks.

Decision:

1. TASK-016 Phase 0 — Pattern C Fast Track.
2. First BAI VIDEO PRODUCTION intake.
3. Continue TASK-016 resilience certification.
4. TASK-017 Common Ingestion Core + Pattern A Hub.
5. TASK-017 normalization/promotion/distribution/federation.
6. TASK-017 late Pattern B.
7. Post-TASK-017 evidence-driven decision gate; no TASK-018 yet.
