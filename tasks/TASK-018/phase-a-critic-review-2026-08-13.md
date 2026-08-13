# TASK-018 Phase A — Critic Design Review

Decision: `PASS_WITH_REQUIRED_FINAL_PLAN_CONTROLS`

Review independence note: this review evaluates stored audit/design artifacts. A separate-agent/session Critic was not invoked in this run; implementation review must obtain independent execution before feature activation.

## Required challenges

1. **Context Guard duplication** — Closed by placing measurement in ContextControl and reusing ContextGuard estimation/inventory. A second file reader or manifest is prohibited.
2. **Rotation may move rather than save cost** — Final Plan requires bootstrap-cost measurement and quality-gated A/B evidence before claiming savings.
3. **Bootstrap overhead** — Must be a first-class metric, not excluded from the denominator.
4. **Same-thread retained context** — Repository handoff is authoritative; retained conversation is advisory and unmeasured retained context must be labeled unknown.
5. **Estimate vs billing confusion** — Separate nullable fields and confidence invariants are mandatory.
6. **Task switching bypasses authorization** — Runnable selection must require explicit implementation/design mode authorization on every node.
7. **Design-Ahead scope creep** — Schemas/interfaces/tests may be drafted; implementation stays blocked when dependencies or authority are unresolved.
8. **Prompt injection** — Repository and external text are data unless present on the canonical instruction allowlist.
9. **Stale handoff overwrite** — Current checkout wins when it descends from recorded HEAD; unrelated history fails closed.
10. **Infinite credit spend** — Paid execution and credit purchase/top-up default deny; no-op runs terminate early.
11. **Schedule overhead** — No fixed high-frequency poll; cadence remains evidence-driven.
12. **Parallel schema corruption** — First phase single worker; shared schema changes cannot be parallelized.
13. **Failed test checkpointed as success** — Checkpoint state distinguishes failed/recovery state and cannot emit success evidence.
14. **Human-owned artifacts** — External/native mutation remains a Human Gate without exact authorization.
15. **Consumer independence** — OS exposes development contracts only; Consumer runtime does not import OS Core.
16. **Capability IDs** — Must be protocol-independent.
17. **Shell bypass** — Allowed Files and command categories are mandatory even when Codex technically has shell access.
18. **Unauthorized discovery** — Hide where possible and always fail closed at dispatch.
19. **WebMCP dependency** — Explicitly Experimental and optional.
20. **Context routing order** — Cost may break ties only after authority, safety and quality.
21. **Visual domain ownership** — Visual Compliance contracts remain in Consumer.
22. **Untrusted tool/page text** — Never authority.

## Required changes accepted into Final Plan

- Phase B API accepts metadata, not raw path reads.
- All usage classes use distinct nullable fields.
- Phase B has no Automation side effects.
- Initial feature flags default deny.
- Activation requires an independent implementation review and Judge answer set; local implementation authorization is not feature activation.

Critical findings: `0`  
High findings after controls: `0`

