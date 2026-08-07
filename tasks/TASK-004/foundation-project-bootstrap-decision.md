# AI Development OS — Foundation Project Bootstrap Decision

## 1. Document Control

| 項目 | 内容 |
|---|---|
| Authoring Role | Foundation Project Bootstrap Planner |
| Active Project | `/home/baisound/projects/javascript-roulette` |
| Active Task | `TASK-004` |
| Runtime Interface | `INLINE_CHAT_LINUX` |
| Scope | Foundation Projectの正規成果物Root、所有権、Git境界、将来TASK配置の設計判断 |
| Persistent Output | 本ファイルのみ |
| Result | `FOUNDATION_BOOTSTRAP_DECISION_READY_WITH_CONDITIONS` |

本書は設計判断の提案であり、`PROJECT.md`、Directory、Task、Registry、Git
Repository、Commit、Completion Review、Archiveを作成・更新・開始しない。

## 2. Current Problem

`/home/baisound/projects/ai-team`には`PROJECT.md`がなく、TASK-000／TASK-005／
TASK-006のActive Project identity、Task Evidence Root、Git境界、Completion／Archive
destinationは未確定である。

同時に、このパスには全Projectが参照する共有の`common/`、`roles/`、Architecture、
Specifications、Registry、Historical `tasks/`がある。名前だけを根拠に既存`tasks/`を
将来Taskの正規保存先へ再分類すると、Historical Evidenceと新規Task Evidenceが混在する。

## 3. Repository Boundary

実行時点の観測結果:

| 調査Path | `git rev-parse --show-toplevel` |
|---|---|
| `/home/baisound/projects/ai-team` | `NONE` |
| `/home/baisound/projects` | `NONE` |
| `/home/baisound` | `NONE` |
| `/home/baisound/projects/javascript-roulette` | `/home/baisound/projects/javascript-roulette` |

従ってFoundation Rootは現時点で独立Git Repositoryでも、親Git Repository配下でもない。
Foundation変更をどのRepositoryへCommitするかは未確定であり、現時点ではCommitしてはならない。

## 4. Existing Directory Inventory

| 実在Path | 現在用途 / Authority | Current / Historical | 新規正規Rootとしての利用可否 |
|---|---|---|---|
| `/home/baisound/projects/ai-team/common/` | 全Project共通仕様 | Current shared specification | 不可。Project-local Task成果物を置かない |
| `/home/baisound/projects/ai-team/roles/` | 全Project共通Role仕様 | Current shared specification | 不可 |
| `/home/baisound/projects/ai-team/architecture/` | Foundation Architecture Canonical Set | Current canonical / historical baselines | 不可。Task Evidenceを混在させない |
| `/home/baisound/projects/ai-team/specifications/` | Foundation仕様・Registry Maintenance仕様 | Current / historical | 不可 |
| `/home/baisound/projects/ai-team/registry/` | Workspace探索・状態の索引 / navigation aid | Current registry, not canonical content | 既存Registryのまま維持。Task Evidence Rootには不可 |
| `/home/baisound/projects/ai-team/tasks/` | 既存TASK-001〜004 Historical Evidence | Historical / migration noticeで不変 | 不可。移動・再利用しない |
| `/home/baisound/projects/ai-team/archive/` | 旧Role仕様Archive | Historical archive | 不可 |
| `/home/baisound/projects/ai-team/docs/ai-team/` | 存在しない | — | 現時点では利用不可。作成には別途認可が必要 |
| `/home/baisound/projects/javascript-roulette/docs/ai-team/tasks/TASK-004/` | 現Active ProjectのTASK-004 Evidence | Current task evidence | Foundation新規Taskの恒久Rootには不可 |

## 5. Authority Analysis

`README.md`は`projects/ai-team/`を全AI管理Projectが読むWorkspace-level
specification領域と定義する。Registry Maintenance SpecificationはRegistryを索引として
定義し、Canonical SourceやTask Evidenceを置き換えない。さらに`tasks/README-MIGRATION-
NOTICE.md`は既存Task directoryをHistorical Evidenceとして、replace／rewrite／renameを
禁止する。

したがって、推奨Baseline案のように`/home/baisound/projects/ai-team/PROJECT.md`を追加して
同一Rootを独立Projectと共有Foundationの双方として扱うには、共有仕様の所有権、Project
Scope Boundary、Registry Authorityを再定義するWorkspace Governance migrationが必要である。
本Decisionだけでは、その二重所有権を安全に確立できない。

## 6. Foundation Project Recommendation

**第一推奨: Foundationを独立Projectとして扱うが、既存共有Foundation Rootとは分離する。**

```text
Shared Foundation Root (unchanged)
/home/baisound/projects/ai-team/

Proposed Foundation Project Root (not created by this decision)
/home/baisound/projects/ai-development-os-foundation/
```

この分離により、`projects/ai-team`は共通仕様・Canonical Architecture・Registry navigation・
Historical Foundation Evidenceを維持し、新ProjectはTASK-000／005／006のProject-specific
task artifacts、Project Status、Completion、Archiveを所有する。

Ownerが「`projects/ai-team`自体をProjectへ昇格する」案を選ぶ場合は、先に共有仕様Rootとの
二重所有権を解消する承認済みWorkspace Governance migrationが必要である。それまでは採用
しない。

## 7. Project Identity

推奨する将来Project Identity:

```yaml
project:
  project_id: ai-development-os-foundation
  project_name: AI Development OS Foundation
  project_type: AI_AUTOMATION_DEVELOPMENT
  primary_domain: SOFTWARE_DEVELOPMENT
  secondary_domains:
    - KNOWLEDGE_SYSTEM
    - DOCUMENTATION_GOVERNANCE
    - AGENT_ORCHESTRATION
  project_root: /home/baisound/projects/ai-development-os-foundation
  shared_foundation_root: /home/baisound/projects/ai-team
  task_evidence_root: /home/baisound/projects/ai-development-os-foundation/docs/ai-team/tasks
```

これは将来の`PROJECT.md`に記録する候補であり、本書によるProject作成や識別子の予約を
意味しない。

## 8. PROJECT.md Proposal

将来の`/home/baisound/projects/ai-development-os-foundation/PROJECT.md`には、最低限次を
含める。

- Project ID、Project Name、Project Type、Primary/Secondary Domains、Mission。
- ScopeとOut of Scope（共有Foundation仕様の無断更新、他ProjectのTask Evidence変更を含む）。
- Project RootとShared Foundation Root。
- Canonical Architecture Ver.2.1、Current Lifecycle Specification Ver.1.3、および必要な
  source-of-truth path。
- Task Evidence Root、Registry Root、Current State Root、Archive Root。
- Runtime Policy、Role Model Policyの参照先、Governance／Owner authority。
- Bootstrap Status、Active Tasks、Historical Tasks、Git Boundary。

PROJECT.mdは共有RootのREADMEやRegistryを複製してはならず、参照とProject-specific
constraintsだけを保持する。

## 9. Canonical Root Structure

推奨する将来構成（本工程では作成しない）:

```text
/home/baisound/projects/ai-development-os-foundation/
├── PROJECT.md
├── docs/
│   └── ai-team/
│       ├── tasks/
│       │   ├── TASK-000/
│       │   ├── TASK-005/
│       │   └── TASK-006/
│       ├── registry/
│       ├── current-state/
│       └── archive/
└── src/                         # TASK-006 implementation scope approved later only
```

`/home/baisound/projects/ai-team`は上記Projectの`shared_foundation_root`であり、Project
Task Rootではない。

## 10. Task Evidence Root

正規Task Evidence Rootの推奨値:

```text
/home/baisound/projects/ai-development-os-foundation/docs/ai-team/tasks/
```

各`TASK-000`／`TASK-005`／`TASK-006`は独立directoryを持ち、task.md、Builder proposal、
Critic review、Builder response、Judge decision、final plan、implementation report/handoff、
test/retest reports、implementation review、final implementation decision、completion-related
recordsを格納する。

Task Evidenceはappend-onlyである。共通Architectureや仕様の正本、Registry、Runtime Stateを
Task Evidence directoryへ複製しない。

## 11. Registry Root

二層に分ける。

1. **Shared Foundation Registry**:
   `/home/baisound/projects/ai-team/registry/`。共有仕様／Canonical Setの探索索引として維持。
2. **Foundation Project Registry**:
   `/home/baisound/projects/ai-development-os-foundation/docs/ai-team/registry/`。Project-local
   Task／Artifactの探索索引として将来作成。

Project-local Registryはshared RegistryのAuthorityを奪わず、各entryはCanonical Sourceの
absolute/approved path、version、checksum、authorityを参照する。両Registryの更新はRegistry
Maintenanceの`DETECT → PROPOSE → AUTHORIZE → UPDATE → VERIFY`を満たす別操作とする。

## 12. Current State Root

同じく二層とする。

- Shared Foundation Current State:
  `/home/baisound/projects/ai-team/registry/current-state.md`。Workspace navigation snapshot。
- Foundation Project Current State:
  `/home/baisound/projects/ai-development-os-foundation/docs/ai-team/current-state/`
  配下の将来Project Status Record。

Project Current StateはProject-local Evidenceからのみ生成し、shared Current Stateを上書きしない。
TASK-004の既存Current StateやHistorical EvidenceをFoundation Projectの状態へ移動しない。

## 13. Archive Root

推奨するProject-local Archive Root:

```text
/home/baisound/projects/ai-development-os-foundation/docs/ai-team/archive/
```

既存`/home/baisound/projects/ai-team/archive/`はshared FoundationのHistorical Archiveとして
維持する。Project-local Archiveへの移動はClosure/Archive authority、manifest、checksum、
retention、rollback、post-move VERIFYが別途承認された場合だけ行う。

## 14. Historical Evidence Policy

| 分類 | 正規位置 | 方針 |
|---|---|---|
| Canonical Specification | Shared Foundation RootのArchitecture／Specifications等 | 正本として参照。Task Evidenceへ複製しない |
| TASK-001〜004 Historical Evidence | `/home/baisound/projects/ai-team/tasks/`および既存Project task roots | 不変。移動・rename・reformatしない |
| Future Foundation Project Task Evidence | 提案Projectの`docs/ai-team/tasks/` | 新規作成後にappend-only管理 |
| Registry Record | 各Registry Root | 索引。本文正本・Task Evidenceを置き換えない |
| Runtime State | Lifecycle等の承認済みProject-specific state path | durable stateと会話／Summaryを混同しない |
| Archive | 各所有RootのArchive | Closure後の承認済み手続だけで格納 |

## 15. Migration Assessment

**Migrationは不要、かつ現時点で禁止。**

既存`tasks/`を新Task Evidence Rootに移す必要はない。将来ProjectのBootstrapは新規Rootから
開始し、既存Foundation文書とHistorical Task Evidenceは参照する。既存パスを新Projectの
正規保存先として再ラベルするMigrationも行わない。

例外として、Ownerがshared Foundation Rootの二重所有権を意図して選択した場合だけ、別Taskで
移行計画、Authority review、rollback、Evidence checksum、Registry update、independent VERIFY
を先に承認する必要がある。

## 16. Git Boundary

推奨Git境界:

```text
/home/baisound/projects/ai-development-os-foundation/.git
```

Foundation Projectの将来変更はこの独立RepositoryにCommitする。`javascript-roulette` Repository
へFoundation ProjectのTask、Registry、sourceを混在Commitしてはならない。shared Foundation
RootについてGit管理が必要な場合は、別のWorkspace Governance DecisionでRepository boundaryと
所有者を確定する。本DecisionはGit初期化もCommitも認可しない。

## 17. TASK Creation Order

推奨順序:

```text
Owner approves Foundation Project identity and roots
    ↓
Foundation Project Bootstrap (PROJECT.md / empty roots / Git boundary) — separately authorized
    ↓
TASK-000: Project Bootstrap / Classification / Runtime / Risk
    ↓
TASK-006 Phase 1: read-only Registry / Discovery + Runtime / Startup MVP
    ↓
TASK-005: Knowledge / Failure Knowledge / Pack MVP
    ↓
TASK-006 later phases: Resolver integration / Owner Support / Conditional Automation
```

TASK-006全体をTASK-005より先に実装しない。先行対象はRegistry／Discovery／Runtime／Startupの
read-only MVPだけであり、Knowledge Resolver integrationとConditional AutomationはTASK-005
MVP後に置く。

## 18. TASK-004 Completion Impact

TASK-004 Completion Reviewは、Foundation Project Bootstrap実装を待つ必要がない。先に必要なのは
OwnerがこのRoot/ownership decisionを確認し、TASK-004の既存Commit/Evidence boundaryとCompletion
authorityを別途判断することである。

Foundation改善計画と本DecisionはTASK-004 Completion Evidenceから参照できるが、TASK-000／005／006
の実装完了をCompletion gateへ追加してはならない。

## 19. Minimum Bootstrap Artifact

次に作成すべき最小Artifactは、実装物ではなく次のOwner-approved Bootstrap Authorization
Recordである。

```yaml
foundation_bootstrap_authorization:
  project_id: ai-development-os-foundation
  project_root: /home/baisound/projects/ai-development-os-foundation
  shared_foundation_root: /home/baisound/projects/ai-team
  task_evidence_root: docs/ai-team/tasks
  registry_root: docs/ai-team/registry
  current_state_root: docs/ai-team/current-state
  archive_root: docs/ai-team/archive
  git_boundary: independent_repository
  protected_roots:
    - /home/baisound/projects/ai-team/tasks
    - /home/baisound/projects/ai-team/registry
  allowed_bootstrap_files: [] # expanded only by later authorization
```

このRecord自体の作成も、本Decisionの後に別途認可する。

## 20. Owner Decisions Required

1. 第一推奨の分離Project Rootを承認するか、shared Foundation Rootの二重所有権移行を別途選ぶか。
2. Project IDを`ai-development-os-foundation`として採用するか。
3. 新Projectの独立Git Repository boundaryを承認するか。
4. Task Evidence／Registry／Current State／ArchiveのProject-local rootsを承認するか。
5. shared Foundation RegistryとProject-local Registryの二層所有を承認するか。
6. TASK-004 Completion Reviewを、Bootstrap実装に依存させず別途進めるか。
7. 次の最小ArtifactをBootstrap Authorization Recordとするか。

## 21. Risks

- `projects/ai-team`をProjectとして直接昇格すると共有仕様とProject-local Evidenceの所有権が
  混在し、Workspace Scope Boundaryを弱める。
- Git Repositoryを後から作る場合、既存untracked Foundation filesを無差別に初回Commitしては
  ならない。明示的なcommit boundary、secret確認、Historical Evidence保全が必要である。
- 二層RegistryはDiscoveryを改善するが、同期方向を明示しないとstalenessや二重Canonical指定を
  招く。
- Project-local Current Stateをshared Current Stateと混同すると、Active Projectの正確な状態が
  失われる。
- 既存Historical `tasks/`の再利用は、Evidence immutabilityとArchive/Completion追跡を損なう。

## 22. Final Recommendation

`/home/baisound/projects/ai-development-os-foundation`を将来の独立Foundation Project Rootとして
Ownerが確定し、既存`/home/baisound/projects/ai-team`は共有Foundation Rootのまま保全することを
推奨する。これにより新規TASK-000／005／006の正規Task Evidence RootはProject-local
`docs/ai-team/tasks/`へ確定でき、Historical Foundation Evidenceは移動不要となる。

このDecision後も、PROJECT.md作成、Directory作成、Git初期化、TASK作成、Registry更新、Migration、
Commit、Push、TASK-004 Completion Review、Archiveを自動開始してはならない。すべてOwnerの次の
明示認可を必要とする。
