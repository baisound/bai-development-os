# BAI Knowledge Hub — Phase 0 Local Foundation Deployment Notes

Status: `LOCAL FOUNDATION ONLY / PRODUCTION ACTIVATION NOT AUTHORIZED`.

The reusable Core contains no production credential. PostgreSQL integration is exposed through an injected `query(sql, params)` boundary in `src/knowledge-hub/postgres-repository.mjs`; the production deployment layer chooses and configures the concrete PostgreSQL driver.

Initial DDL: `postgres/001_initial.sql`.

Do not place passwords, bearer tokens or Product API keys in this directory. VPS purchase, public DNS/TLS, production token issuance and real Consumer Evidence collection require a later deployment/security/budget gate.

## Local HTTP smoke

The local in-memory HTTP foundation can be run only with an explicitly supplied development credential:

```bash
BAI_KNOWLEDGE_HUB_DEV_TOKEN='<temporary-local-token>' \
BAI_KNOWLEDGE_HUB_PRODUCT_ID='bai-video-production' \
npm run knowledge-hub:local
```

This is loopback-only and intentionally not a production process manager, TLS terminator or durable persistence mode.
