# TASK-019 — Foundation Critic Review

## Review result

`CRITIC_PASS_AFTER_TWO_FIX_CYCLES`

## Findings

1. `HIGH / CLOSED`: `handoff-revalidation-report.canonical_facts` initially allowed a free-form nested object, weaker than the closed-schema requirement. It was replaced by a closed array of scalar fact key/value/value-checksum records, with negative tests for object-valued facts.
2. `MEDIUM / CLOSED`: Windows directory `fsync` may report `EPERM` after the shared Security writer has atomically renamed a verified file. The repository now accepts this case only when Windows is detected and reread bytes exactly match the intended checksum; Linux keeps the full durability path.
3. `MEDIUM / CLOSED`: partial source-curation decisions were initially accepted. The contract now requires exactly one decision for every supplied artifact.
4. `MEDIUM / CLOSED`: schema-level interaction acceptance did not encode the runtime native-Evidence restriction. A conditional schema rule now requires `REAL_NATIVE` and PASS/NOT_APPLICABLE checks for an acceptance PASS.
5. `HIGH / CLOSED`: transition to `AUTHORIZED` could be reached without an exact Owner/design/Allowed-Files binding. The transition now requires an explicit Owner authorization plus checksummed Task, design, Allowed Files and authorization references.
6. `HIGH / CLOSED`: conversation-free resume compared only a subset of checkpoint identity. It now fails stale on any intake, revision, project, Task, capability, HEAD, status-revision or source-fingerprint drift.
7. `MEDIUM / CLOSED`: runtime native acceptance could previously PASS with no durable Evidence reference. Runtime and schema now both require at least one checksummed Evidence reference.
8. `MEDIUM / CLOSED`: a Knowledge recommendation could be emitted from an unreproduced one-off observation. It now requires reproduced recurrence of at least two and Critic PASS while retaining zero promotion authority.

## Boundary review

- handoff, metric, Candidate and repository record remain noncanonical;
- roadmap analysis cannot allocate a Task or mutate Canonical files;
- `AUTHORIZED` cannot be entered without an exact checksummed Owner/design/Allowed-Files binding;
- Knowledge recommendation cannot promote Knowledge;
- mock/static interaction cannot claim native PASS;
- DLP and symlink/path confinement execute before persistence;
- final manifest is the only revision-finalization authority;
- no external process, network, provider, Consumer or production mutation exists.

Unresolved Critical/High: `0 / 0`.
