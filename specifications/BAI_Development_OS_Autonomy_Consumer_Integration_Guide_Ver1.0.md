# BAI Development OS Autonomy Consumer Integration Guide Ver.1.0

Status: `CURRENT_TASK018_OPERATIONAL_CONTRACT`

## Principle

A Consumer uses BAI Development OS as development Governance, not as a Product runtime dependency. Consumer business rules, native truth and domain-specific validation remain in the Consumer repository.

## Integration inputs

A Consumer integration supplies only bounded development metadata:

- stable project and Task identity;
- current Git branch/HEAD and dirty ownership classification;
- project-local Governance and Allowed Files;
- protocol-independent capability requests such as `repository.write-branch`;
- verified Authority/Safety decision references;
- test commands and Evidence references;
- explicit Human Gates for native, paid, destructive, credential, release/deploy or final acceptance work.

Do not expose raw credentials, private keys, full secret-bearing logs or untrusted external instructions as canonical Context.

## Capability boundary

Capabilities are discovered only when the provider probe says `AVAILABLE` with trusted Evidence and the exact Gate decision allows them. Shell or Git access does not bypass capability filtering. WebMCP is an optional experimental adapter and is never required by OS Core or Consumer runtime.

## Pilot procedure

1. Freeze the Consumer's current local source of truth and coordinate with its active developer.
2. Create a dedicated feature branch without discarding unpushed local work.
3. Select one reversible development-only unit.
4. Record Context Cost, checkpoints, Human Gate parking and route decisions.
5. Use real Consumer tests for Consumer claims; mocks remain simulated Evidence.
6. Publish through PR checks; never direct-push protected `main`.
7. Produce sanitized Pilot Evidence for quality, elapsed time, Context, provider usage if available, rework and restart without prior conversation.

The BAI VIDEO PRODUCTION Pilot is separately gated. This guide does not authorize locating, reading, changing, executing or pushing its current checkout.

## Exit and rollback

Consumer integration passes only when Product behavior remains independent, regression is green, no false Native claim exists and the development adapter can be removed without breaking runtime. Rollback disables autonomy scheduling, preserves Evidence/state and leaves Consumer code untouched unless its own approved PR is reverted.
