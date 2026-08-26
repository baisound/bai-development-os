# TASK-021 — Independent Design Critic Three-round Evidence

## Scope

Three independent Critic roles reviewed the TASK-021 Task Definition, Owner authorization boundary, roadmap refinement, detailed specification, TASK-004 Lifecycle implementation, Context Control, Security authorization/path controls, TASK-020 queue/durable coordination and dependency behavior. Critics made no repository edits.

## Round 1

| Critic | Result | Critical | High |
|---|---|---:|---:|
| Lifecycle / durability | REJECT | 1 | 7 |
| Authority / security | REJECT | 2 | 5 |
| Migration / queue / Consumer | REJECT | 0 | 4 |

Findings included pre-ack Snapshot consumption, self-asserted Owner authority, caller-shrunk Context, all-N/A readiness, Windows root escape, undefined mixed-version recovery, Archive readiness inflation and incomplete Consumer cutover.

## Round 2

R2 closed the original findings but introduced a circular checksum graph among Context, readiness and Owner authority. It also exposed raw transition-ID pathname use, legacy completion durability ambiguity and insufficient post-commit signature/epoch/revocation proof. Result remained REJECT.

## Round 3 and final correction

The final design introduced:

- non-circular Base Context → Statement/Readiness → Operation Coordinate → signed Owner envelope → signed verifier Attestation → Operation Bundle DAG;
- strict store-generated UUID preparation, TTL and single-use CAS;
- closed Record/Event/receipt compatibility and outcome schemas;
- SecurityOS root confinement/read-set TOCTOU revalidation;
- durable final commit receipt and verified Canonical read;
- signed `LEGACY_COMPLETION_ATTEST` with immutable Log-prefix proof;
- post-commit Owner and verifier signature/epoch/revocation validation;
- fixed Context profiles and strict readiness dimensions;
- Canonical-bound queue/dependency selection.

Final independent results:

| Critic | Critical | High | Judge route |
|---|---:|---:|---|
| Lifecycle / durability | 0 | 0 | READY |
| Authority / security | 0 | 0 | READY |
| Migration / queue / Consumer | 0 | 0 | READY |

## Final Critic decision

`PASS_DESIGN_CRITIC_3_ROUNDS / UNRESOLVED_CRITICAL_HIGH_0_0`.

Nonblocking implementation details remain subject to tests: explicit prepare API, signed legacy attestation capability, Event outcome schema branches, immutable authority history and BAI VOICE APP full commit/API runbook fields.
