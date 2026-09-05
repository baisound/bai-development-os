# TASK-022 — GPT-6 Astra Operating Rules

## Identity

- Design ID: `BAI-OS-GPT6-ASTRA-OPERATING-RULES-001`
- Priority: `P1 / OWNER_DIRECTED`
- DEV Profile: `DEV_2_STANDARD`
- Classification: `DESIGN_ONLY`
- Status: `DESIGN_INTEGRATED / VALIDATION_PASS`
- Branch: `codex/task-022-gpt6-astra-rules`
- Baseline: `1ce69bac5960372b1624f12fc6b43f14f2826b5c`

## Owner directive

On 2026-09-06 the Owner directed BAI Development OS to incorporate the supplied X thread, including its seven follow-up posts, into the rules used when GPT-6 is selected. The external thread is Evidence and design input. Current official OpenAI documentation is the compatibility authority for model behavior and API requirements.

## Goal

Add a bounded GPT-6 Astra operating profile that preserves the vendor-neutral Model Control route and applies only after `gpt-6-astra` has been selected by existing Authority, Safety, capability, reliability, sensitivity and budget gates.

## Required controls

1. Preserve system/platform safety and Canonical Owner authority above user and skill guidance.
2. Bias authorized work toward completion without bypassing Human Gates or external-effect approval.
3. Fail closed on unsupported reasoning efforts, request parameters, tool endpoints and EU service tiers.
4. Define conditional rules for async tools, mid-turn steering, reasoning updates and prompt-cache migration.
5. Calibrate delegation and testing to task risk and available harness authority.
6. Measure observed task cost and quality; do not infer savings from token price or a third-party claim.
7. Keep source provenance and freshness explicit; no paid provider call or Production Activation is authorized.

## Permanent boundaries

- No change to the vendor-neutral routing order or automatic default-model selection.
- No API credential creation, paid invocation, Deploy, Release, Tag or Production Activation.
- No Consumer repository mutation.
- No weakening of Security, Human Gate, Critic/Judge independence or Evidence requirements.

## Canonical design

`specifications/TASK-022_BAI_Development_OS_GPT6_Astra_Operating_Rules_Ver1.0.md`
