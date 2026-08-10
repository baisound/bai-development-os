# Consumer Evidence Privacy and Forbidden Fields Ver.1.0

Status: `TASK-016 PHASE0 RC2 CANONICAL`

- P0: minimal operational/aggregate Evidence.
- P1: sanitized diagnostic Evidence.
- P2: explicit contextual/user-approved Evidence.
- P3: rejected by v1 contract.

Hard forbidden runtime Evidence: raw video/image/audio, subtitle/transcript body, prompt body, user-file content, API key/token/Authorization/private key, email/phone, user-bearing absolute paths, unnecessary local filenames, full crash dumps and unreviewed arbitrary nested JSON.

The server repeats validation. Client sanitization is defense-in-depth, not an authorization boundary. Sanitizer/privacy failure drops or quarantines the Event and never blocks primary Product operation.
