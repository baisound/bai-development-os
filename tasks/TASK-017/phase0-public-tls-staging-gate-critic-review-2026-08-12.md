# TASK-017 Phase 0 — Public TLS Staging Gate Critic Review

Decision: `PASS WITH VPS EXECUTION GATE`
Date: `2026-08-12`

## Reviewed risks

1. **Accidental Production ACME** — PASS. The harness and Evidence validator accept only the exact Let's Encrypt staging directory; Production URL is absent from the harness.
2. **Unapproved activation** — PASS. Exact acknowledgement is mandatory. Documentation preserves a separate VPS execution decision.
3. **Firewall mutation** — PASS. The harness performs no UFW or firewall write. Reachability preparation stays an explicit operator step.
4. **Persistent exposure** — PASS. Caddy is stopped on success and best-effort stopped on failure; PASS Evidence requires post-run deactivation.
5. **Private service exposure** — PASS. Compose readiness and live listener checks cover API 8787, PostgreSQL 5432 and Caddy admin 2019; only loopback 8787 is tolerated.
6. **HTTP/3 expansion** — PASS. UDP 443 is rejected before and during execution.
7. **Data destruction** — PASS. No volume deletion, env regeneration, restore or database mutation is introduced beyond existing Compose dependency startup.
8. **Secret leakage** — PASS. Evidence contains certificate digest/validity and booleans only; it excludes keys, raw certificates, credentials, logs and Product data.
9. **False live claim** — PASS. Static tests do not claim issuance or external reachability. Real PASS requires VPS-generated Evidence.
10. **Existing service collision** — PASS. Occupied TCP 80/443 causes a stop rather than automatic service termination.

## Residuals

- ACME challenge reachability, the actual staging issuer text and VPS `ss` behavior remain environment Evidence.
- The isolated environment lacks the external reference Consumer, so Product Boundary revalidation must run in Canonical CI/checkout context.
- Production Certificate and persistent public endpoint decisions remain outside this implementation review.
