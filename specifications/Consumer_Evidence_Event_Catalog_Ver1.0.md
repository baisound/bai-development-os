# Consumer Evidence Event Catalog Ver.1.0

Status: `TASK-016 PHASE0 RC2 CANONICAL`
Machine companion: `schemas/knowledge-evolution/consumer-evidence-event-catalog.v1.json`

| type | feature | privacy | result | properties |
|---|---|---|---|---|
| `feature_result` | `subtitle_import` | P0/P1 | success/failure | `cue_count` |
| `performance` | `long_running_job_result` | P0/P1 | success/failure | `chunk_count`, `resume_used`, `resumed_chunk_count` |
| `correction` | `subtitle_review_summary` | P0/P1 | completed/aborted | imported/edited/inserted/deleted/approved cue counts, `export_success` |

`duration_ms`, `retry_count`, and sanitized `error_code` are optional only where listed by the machine catalog. Unknown feature/property combinations are rejected until a reviewed catalog revision authorizes them.

No subtitle/transcript/media/prompt content, filename, absolute path, secret, personal contact data or arbitrary free text is part of these pilot entries.
