# TASK-018 Phase H1.2 — Builder Implementation Evidence

Date: `2026-08-13`
Gate candidate: `SAFETY_FIRST_ROUTING_PASS`

## Implemented

- Added a pure deterministic Safety-first Autonomy Route selector and verifier.
- Authority, exact Safety Floor, allowed capability tier, Model Control, DEV Profile, capability, quality, provider, paid/native authorization and cost ceiling are hard eligibility filters.
- Paid/native authorization requires an exact verified result and SHA-256 Evidence binding; a boolean claim alone fails closed.
- Candidate Context estimates require SHA-256 Evidence binding.
- A validated Context Cost record with Quality `PASS` may break only a quality-and-reliability tie between already eligible routes.
- `FAIL`, `UNKNOWN`, mismatched or tampered Context Evidence cannot influence routing.
- The output is immutable, checksum-bound, input-order independent, binds the normalized routing input and declares `authority_created: false`.

## Verification

- Focused routing/context/model/hardening gate: `47 / 47 PASS`.
- WSL2 Ubuntu ext4 full regression: `1409 / 1409 PASS`.
- Windows checkout full regression: environment-invalid because existing durable-write tests receive Windows `fsync EPERM`; the new focused gate passes on Windows and the canonical Linux gate passes in full.
- Diff whitespace check: `PASS`.

## Boundary

No external Automation, Consumer checkout, native application, paid execution, Deploy, Production Activation, Tag or Release was invoked.
