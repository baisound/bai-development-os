# ADR — Knowledge Hub PostgreSQL / VPS-First / Optional-Hub Architecture Ver.1.0

Status: `ACCEPTED_PLANNING_DECISION`
Date: `2026-08-11`
Implementation authorization: `NONE`

## Decisions

1. BAI Knowledge Hub v1 uses PostgreSQL.
2. Initial Hub deployment is one VPS with Docker Compose.
3. Infrastructure hard ceiling is 3,000 JPY/month; target is 1,500–2,500 JPY/month.
4. Application, Database and Storage are logically separated but may share the same VPS.
5. Managed DB, Kubernetes, Kafka, dedicated load balancer, separate vector DB and GPU host are not default v1 components.
6. pgvector is optional and introduced only when semantic similarity becomes a measured requirement.
7. The Hub is an Evidence/Candidate exchange service, not Canonical Knowledge authority.
8. BAI Development OS private Git remains Canonical Knowledge authority.
9. Consumer Projects do not receive BAI Development OS write credentials.
10. Pattern C works without Hub; Pattern B also must not depend on Hub when eventually implemented.

## Rationale

The design prioritizes immediate knowledge capture, low recurring cost, private-repository isolation and future portability. PostgreSQL is intentionally selected for JSONB/provenance-heavy data and an optional future vector path even though MySQL is familiar operationally.
