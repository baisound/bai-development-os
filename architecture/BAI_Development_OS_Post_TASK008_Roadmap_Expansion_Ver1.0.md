# BAI Development OS Post-TASK-008 Roadmap Expansion Ver.1.0

## Decision

TASK-004完走時に露呈した製品化・長期運用上の拡張候補を、TASK-004へ追記実装せず将来Taskとして分離する。既存TASK-005〜008は維持し、その後段へTASK-009〜014を追加する。

## Why these are separate Tasks

TASK-004の責務はLifecycle Foundationであり、completed Evidenceを将来拡張で再オープンしない。今回の実装では、Security境界、配布再現性、単一Consumer依存、System Sync後のdrift、Domain拡張、Adaptive Governanceの長期校正という「Foundation完成後に製品として育てる課題」が具体化した。これらは独立したAcceptance CriteriaとTest Strategyを持つべきである。

## Reserved Tasks

| Task | Name | Trigger observed during TASK-004 completion | Status |
|---|---|---|---|
| TASK-009 | Security, Supply Chain & Integrity Hardening | Archive/System Syncでsymlink root escapeをCriticが発見 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED |
| TASK-010 | Release, Distribution & Consumer Upgrade OS | Consumer build再現がpackage registry可用性に依存 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED |
| TASK-011 | Multi-Project Conformance & Compatibility Lab | Reference Consumerが実質1系統で、基盤の汎用性検証を拡大する必要 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED |
| TASK-012 | Self-Maintenance, Drift Detection & Safe Auto-Repair | System Syncは完成したが長期driftの継続検出/修復は別責務 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED |
| TASK-013 | Domain Adapter / Plugin SDK | OSをsoftware以外の動画・音声・配信等へ拡張する正式境界が必要 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED |
| TASK-014 | Adaptive Governance Calibration & Policy Learning | DEV-0〜4の「やり過ぎ/不足」を実績から校正する長期feedback loopが必要 | PROPOSED / NOT_STARTED / NOT_AUTHORIZED |

## Guardrails

- TASK-005〜008の順序・責務はこの追加で変更しない。
- Permanent model-selection policyは変更しない。
- TASK-014はCritical safety floorを自動で下げてはならない。
- 新Taskは正式task.mdとOwner authorizationなしに開始しない。
- TASK-004 completed artifacts/Evidenceは改変しない。

## Canonical integration

Architecture Ver.2.5 Part VIを正本とする。この文書はDecision rationale / navigation artifactである。
