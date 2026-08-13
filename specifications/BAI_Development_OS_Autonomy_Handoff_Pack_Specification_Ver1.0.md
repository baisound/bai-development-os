# BAI Development OS Autonomy Handoff Pack Specification Ver.1.0

Status: `CURRENT_TASK018_OPERATIONAL_CONTRACT`

## Two boundaries

Bootstrap Manifest proves what may be loaded at session start. Compressed Handoff records an exact safe resume point. Neither may overwrite a newer checkout or replace Owner/Registry authority.

## Bootstrap Manifest requirements

The Manifest binds project identity, recorded HEAD, authority sources and every candidate file by path, SHA-256, critical flag, trust level, instruction scope, secret flag, Context inclusion decision, token estimate, change/stale state and current-Task relevance.

Critical Authority files must exist and match. Secret-bearing Context is blocked. External instructions remain untrusted. Git relation must be classified as equal, recorded ancestor, current ancestor, unrelated or unknown; unknown fails closed. Unknown dirty ownership also fails closed.

## Minimal loading output

Bootstrap returns source-of-truth class, staleness findings, dirty preservation state, Authority resolution and an ordered minimal Context plan. A newer checkout remains code Source of Truth. Handoff-only restoration is read-only until reconciled.

## Compressed Handoff requirements

Target maximum: `2,000 estimated tokens` under validated policy. Required content:

- project/Task/session checkpoint identity;
- exact branch and HEAD;
- dirty flag and exact dirty paths;
- last completed atomic unit and passed gates;
- next safe action;
- files to read and files not to touch;
- source references with SHA-256 and estimated tokens;
- checkpoint checksum and Handoff content checksum;
- `previous_conversation_required: false`.

Do not embed full source, full diffs, full logs, complete Architecture or repeated rationale when a path and hash suffice.

## Resume validation

Conversation-free resume requires matching project, Task, HEAD, checkpoint checksum and every observed source checksum. Changed sources produce `SESSION_HANDOFF_SOURCE_CHANGED`; changed resume state produces `SESSION_RESUME_STATE_CHANGED`. Invalid/tampered Handoff or checkpoint fails closed.
