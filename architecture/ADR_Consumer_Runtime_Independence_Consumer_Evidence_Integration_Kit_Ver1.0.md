# ADR — Consumer Runtime Independence & Consumer Evidence Integration Kit Ver.1.0

Status: `ACCEPTED_PLANNING_DECISION`
Date: `2026-08-11`
Implementation authorization: `NONE`

## Context

BAI Development OS is used while developing Consumer Projects, but completed products such as BAI VIDEO PRODUCT are intended to build, distribute and run standalone. At the same time, a distributed Product should be able to submit privacy-minimized runtime Evidence to BAI Knowledge Hub.

Because BAI Development OS and its integration technology are open-source/source-visible, client-side security cannot rely on hidden endpoints, hidden schema or embedded shared secrets.

## Decisions

1. BAI Development OS is a development foundation, not a mandatory Consumer runtime framework.
2. Consumer build artifacts SHALL have zero BAI Development OS runtime dependency unless a future Product explicitly and separately chooses one.
3. Evidence integration generated/copied from OS templates becomes Consumer-owned source code.
4. The OS provides a `Consumer Evidence Integration Kit` consisting of contracts, reference implementation, generators/templates, Mock Hub and contract tests.
5. The common credential contract is a `CredentialProvider` interface; raw API credentials are never embedded in source/config/build artifacts.
6. BAI VIDEO PRODUCT uses Microsoft Password Manager as its selected credential source. Exact Microsoft API selection belongs to Product implementation and is not inferred by Core.
7. Hub/credential/Evidence failure SHALL NOT make a Consumer's primary product function fail.
8. The Client is assumed inspectable. Server-side authentication, authorization, rate limiting, payload validation, idempotency, retention and abuse protection are mandatory.
9. Trust Level is assigned by Hub/review provenance, not accepted from a Client assertion.
10. Raw Product content is not collected by default; Hub v1 does not accept P3 raw user content by default.
11. Runtime Consumer Evidence can support Knowledge Candidates but cannot automatically promote Canonical Knowledge.

## Consequences

- Consumer integration remains portable and reusable across languages/platforms.
- Product-specific credential providers do not contaminate Core with a Windows-only runtime dependency.
- Public source disclosure does not expose a shared embedded secret because none exists.
- Knowledge Hub remains an optional operational side channel.
- Mock Hub and contract tests become critical development-time deliverables.
