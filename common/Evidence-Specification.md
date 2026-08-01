# Evidence Specification

## Purpose

Define auditable evidence requirements shared by all Roles.

## Evidence priority

1. saved canonical artifacts,
2. actual repository files,
3. recorded command output,
4. independently observed runtime behavior,
5. user-provided evidence with source and limitations,
6. agent summaries.

## Evidence rules

- Record exact paths.
- Record exact commands or procedures.
- Record observed output, not expected output.
- Separate confirmed, unconfirmed, and inferred statements.
- Do not treat Builder claims as independent test evidence.
- Do not treat recommendations as state transitions.
- Do not rewrite historical evidence.
- Record limitations and missing evidence.

## Finite commands

Record:

- command,
- working directory,
- relevant environment,
- observed output,
- exit code,
- Result.

## Persistent processes

Record:

- start command,
- ready or startup log,
- configured URL or endpoint,
- HTTP or equivalent reachability,
- shutdown or handoff status.

Do not judge a persistent process only by exit code.

## User-provided evidence

When using screenshots, logs, or manual user observations, record:

- source,
- date or context,
- what it proves,
- what it does not prove,
- limitations.

## Evidence preservation

Historical artifacts remain immutable. Later corrections must be appended through a new artifact.

## Verification failure

When expected evidence is missing or unreadable, use `NOT_CONFIRMED` unless an observed failure supports `FAIL`.
