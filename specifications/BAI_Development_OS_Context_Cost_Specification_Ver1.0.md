# BAI Development OS Context Cost Specification Ver.1.0

Status: `CURRENT_TASK018_OPERATIONAL_CONTRACT`

## Measurement contract

Context Cost is deterministic observability over already selected sources. It does not read files or provider dashboards itself. Each source records identity/hash, selection reason, trust, mandatory/cacheable state, estimated/observed tokens, use, duplication, staleness and change state.

Estimated input, provider-observed input/output, cached input and billed tokens are distinct nullable fields. Unknown values remain `null`; they are never represented as zero. `EXACT_PROVIDER_REPORTED` requires observed usage. Confidence values are exact provider, provider estimate, local tokenizer, character heuristic, mixed or unavailable.

## Derived metrics

The record derives source count, estimated input, duplicate, stale, useful and avoidable tokens plus their ratios. Avoidable tokens are a union, so one duplicate/stale/unused source is not double-counted.

Default provisional thresholds are Warning `0.10`, Major `0.25`, Critical `0.50` with repeat count `2`. These are policy inputs, not universal truth. `CONTEXT_OVERFETCH` is Evidence, not automatic policy authority.

Efficiency is evaluated only with a known Quality Gate. Quality `FAIL` yields score zero; `UNKNOWN` yields unavailable. The formula is `useful_ratio*(1-duplicate_ratio)*(1-stale_ratio)*100`.

## Routing and Knowledge use

Verified Quality-PASS Context Evidence may break only a quality-and-reliability tie among routes already passing Authority, Safety, DEV, capability, provider, paid/native and budget gates. Candidate estimates require Evidence checksums; the decision binds normalized routing input.

Context savings cannot override hard floors or reduce required quality, Authority, Safety, Security or Evidence.

Repeated verified overfetch may create immutable noncanonical Failure Evidence and an inactive Knowledge Candidate. Promotion still requires Critic, evaluation and authorized activation.

## Reporting

Always label values as estimated, observed or billed. Report unavailable telemetry honestly. Compare rotation/cadence only after real Pilot samples preserve or improve quality.
