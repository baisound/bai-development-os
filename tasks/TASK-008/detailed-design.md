# TASK-008 Detailed Design Record

The detailed machine canonical is `specifications/TASK-008_BAI_Development_OS_External_Integration_Ver1.0.md`.

Design decision: IntegrationOS is vendor-neutral. Connector manifests declare capabilities; runtime adapters are replaceable. External side effects require bound authorization and idempotency. External responses remain noncanonical references.

14 internal phases are implemented and verified.
