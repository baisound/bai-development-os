# AI Summary — Canonical Roles

## Core Rule

**Role is not the same as Agent or Session.** One runtime may execute multiple Roles sequentially, but each Role must preserve its own authority, inputs, outputs, and prohibited actions.

## Roles

### Builder

- Source: `roles/README-Builder.md`
- SHA-256: `f1e6fd8f9cbe4c771858774118c334addf60c9e7072b41ad892796ad4f590326`
- Key headings: Builder Role Specification, Dependencies, Role, Responsibilities, Required inputs, Required outputs, Implementation output rule, Files allowed to modify, Files prohibited from modification, Authority boundary

### Critic

- Source: `roles/README-Critic.md`
- SHA-256: `610d3e652e437c3c14ec4bb12c0aef749893af27c70b1202ec62ee88e780e1b0`
- Key headings: Critic Role Specification, Dependencies, Role, Responsibilities, Required inputs, Required outputs, Files allowed to modify, Files prohibited from modification, Authority boundary, Result vocabulary

### Judge

- Source: `roles/README-Judge.md`
- SHA-256: `4c9be7cecd4c6a8befedd697bcc445a6d0e18524e6c138a704642cf033b716b8`
- Key headings: Judge Role Specification, Dependencies, Role, Responsibilities, Required inputs, Design Judgment, Final Plan Consistency Check, Final Implementation Judgment, Required outputs, Files allowed to modify

### Orchestrator

- Source: `roles/README-Orchestrator.md`
- SHA-256: `9f050e122c959eb9915b91b0548bf0c89c07b8444ad871cc7fb4a08a4c40364a`
- Key headings: Orchestrator Role Specification, Dependencies, Role, Responsibilities, Required inputs, Required output: Routing Envelope, Files allowed to modify, Files prohibited from modification, Authority boundary, Gate Readiness vocabulary

### Project-Policy

- Source: `roles/README-Project-Policy.md`
- SHA-256: `d845adb982726a793228804196805c97c7d5a330cfa164b7313edb010c1e7de7`
- Key headings: Project Policy Agent Role Specification, Dependencies, Role, Responsibilities, Required sequence, Required inputs, Required outputs, Files allowed to modify, Files prohibited from modification, Authority boundary

### Tester

- Source: `roles/README-Tester.md`
- SHA-256: `a8069da59e25512b2d05105ba1fcce83f9a55c23ca42cc5979eb2ed9840917b5`
- Key headings: Tester Role Specification, Dependencies, Role, Responsibilities, Independence from Builder, Required inputs, Required outputs, Result vocabulary, Files allowed to modify, Files prohibited from modification

## Loading Policy

Load only the active Role specification. Orchestrator may load the next Role specification for routing checks, but must not perform that Role's work.
