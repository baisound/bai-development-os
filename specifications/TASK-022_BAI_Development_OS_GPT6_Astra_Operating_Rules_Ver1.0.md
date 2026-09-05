# TASK-022 — BAI Development OS GPT-6 Astra Operating Rules Ver.1.0

Status: `CURRENT_TASK022_DESIGN`
Classification: `DESIGN_ONLY`
Design ID: `BAI-OS-GPT6-ASTRA-OPERATING-RULES-001`
Owner direction: `2026-09-06`

## 1. Purpose

Define how BAI Development OS uses GPT-6 Astra after the vendor-neutral Model Control layer has selected it. The design turns the Owner-supplied X thread and its seven numbered replies into bounded operating rules, while preserving higher Authority, Safety, Human Gate, Context Economy, Evidence and cost-control contracts.

## 2. Scope

### In scope

- model-specific prompting and collaboration behavior;
- request compatibility and migration gates;
- conditional async tool, mid-turn steering and reasoning-update rules;
- delegation and test calibration;
- task-cost Evidence requirements;
- source provenance, freshness and conflict handling.

### Out of scope

- changing the default model or permanent vendor-neutral routing order;
- installing or invoking a provider;
- creating credentials or spending paid credits;
- Consumer runtime changes;
- Release, Deploy, Tag, merge or Production Activation;
- claiming GPT-6 Astra is cheaper, faster or more reliable without comparable observed Evidence.

## 3. Source authority

The supplied X thread is `EXTERNAL_SECONDARY / NON_CANONICAL_EVIDENCE`. Its root post and replies `1` through `7` were observed on 2026-09-06. The thread provides a useful grouping of behavior and migration advice but does not independently establish product compatibility, price, availability or task cost.

OpenAI's current Model guidance and GPT-6 Astra model page are the primary technical sources. Their relevant content was fetched on 2026-09-06. If official guidance changes, the verified operating profile must be revised before paid or production use. BAI Development OS Canonical policy remains the execution authority.

## 4. Design principles

### 4.1 Additive profile

The GPT-6 Astra profile is activated by exact model identity after existing routing. It cannot select itself, create budget, lower sensitivity controls or bypass unavailable/deprecated provider states.

### 4.2 Autonomous preparation, gated effect

The model should progress through routine and reversible work without unnecessary pauses. It prepares the concrete result before seeking a decision. The exact action requiring Owner or Human authority remains parked. This converts the thread's autonomy recommendation into a safe sequencing rule rather than a blanket permission.

### 4.3 Explicit precedence

The phrase "user instructions override skills" is accepted only inside the complete precedence chain. Platform/system safety and Canonical authority remain higher. Skill guidance remains lower and cannot create authority.

### 4.4 Evidence over marketing inference

Higher token prices and lower estimated task cost can coexist, but neither the thread nor model marketing is sufficient OS Evidence. A promotion decision needs comparable workload, output quality, completion, usage, cache, retries, tool charges and billed-cost observation.

## 5. Operating contract

The normative runtime-facing rules are `registry/gpt-6-astra-operating-rules.md`. A GPT-6 Astra session must load that file after the active Task and direct dependency contracts, and only when `gpt-6-astra` is the selected model.

The profile covers:

1. activation and instruction precedence;
2. initiative and follow-through;
3. skill/context transparency;
4. writing style;
5. delegation;
6. risk-scaled testing;
7. API compatibility;
8. async tools, steering and reasoning updates;
9. task-cost and quality Evidence;
10. source review and freshness.

## 6. API compatibility contract

The preflight must fail closed on any verified incompatibility:

| Gate | Required condition |
|---|---|
| Model identity | exact `gpt-6-astra` |
| Reasoning | `low`, `medium`, `high`, `xhigh` or `max` |
| Tool calling | Responses API |
| Sampling parameters | no `temperature`, `top_p` or `top_logprobs` |
| Log probabilities | no Chat Completions `logprobs`; no Responses `message.output_text.logprobs` include |
| EU residency | no `fast` or `priority` service tier |
| Cache migration from GPT-5.5 or earlier | no legacy retention field; use `prompt_cache_options.ttl: "30m"` when retaining that caching behavior |

Compatibility errors do not authorize silent model fallback. Existing Model Control owns explicit fallback and escalation.

## 7. Conditional feature contract

### 7.1 Async tool calls

The application remains responsible for executing tools and persisting pending-call state. Enable async calls only with original-call identity, deterministic result reattachment, cancellation/recovery and audit support.

### 7.2 Mid-turn steering

Steering requires a verified WebSocket continuation path, deterministic association with the active response and explicit pending-tool handling. A later user instruction may narrow or replace current work under normal precedence; it cannot grant external-effect authority implicitly.

### 7.3 Reasoning-effort updates

Conversation-time changes use `configuration_update` only in a currently supported standard single-agent shape. The request-level reasoning prefix remains stable when prompt-cache preservation is required.

## 8. Delegation and verification

Delegation is conditional on harness capability, task policy and separability. It preserves required role independence and readable handoffs. The OS does not force subagents for serial, tightly coupled or coordination-heavy work.

Testing follows Adaptive Governance. Focused checks run first; broader checks depend on risk and reach. Low-impact reversible documentation work does not need a mirrored unit test, while security, state-machine, migration, recovery and cross-project boundaries retain their safety floors.

## 9. Failure states

- `PROFILE_STALE`: official model guidance has not been revalidated for the planned paid/production use.
- `API_INCOMPATIBLE`: reasoning, endpoint, parameter, tier or cache migration conflicts with verified guidance.
- `AUTHORITY_BLOCKED`: the next effect lacks the required Owner/Human authority.
- `EVIDENCE_INCOMPLETE`: cost, quality, completion or provider usage is claimed without observation.
- `CAPABILITY_UNCONFIRMED`: async, steering or reasoning-update prerequisites are not verified.

Each failure parks only the dependent unit. Independent authorized work continues.

## 10. Rollback

Rollback removes the Task-022 loading references and restores the prior state in which no GPT-6-specific operating profile exists. Because this change does not alter the routing algorithm, provider credentials, runtime requests or Consumer code, rollback has no provider or data migration.

## 11. Validation

Required validation for this design-only integration:

- every numbered X reply has a recorded disposition;
- official compatibility facts map to the operating profile;
- no rule weakens higher authority or Human Gates;
- no default model, provider activation or paid execution is introduced;
- Markdown links and repository paths resolve;
- `git diff --check` passes;
- existing Model Control focused tests remain green.

## 12. Decision

`DESIGN_ACCEPTED_FOR_BOUNDED_OPERATIONAL_LOADING`

This decision makes the profile available when GPT-6 Astra is explicitly selected. It does not authorize API execution, provider spending, a routing promotion or Production Activation.
