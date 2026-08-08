export const EXTENSION_VERSION='1.0.0';
export const TRUST_LEVELS=Object.freeze(['OFFICIAL','COMMUNITY','PROJECT_LOCAL']);
export const LIFECYCLE_STATES=Object.freeze(['INSTALLED','VALIDATED','ENABLED','DISABLED','REVOKED']);
export const EXECUTION_MODES=Object.freeze(['DECLARATIVE','SANDBOXED','IN_PROCESS_TRUSTED']);
export const SIDE_EFFECTS=Object.freeze(['NONE','REVERSIBLE_LOCAL','IRREVERSIBLE_LOCAL','EXTERNAL']);
export const PACK_TYPES=Object.freeze(['PROJECT_POLICY','TEST','EVIDENCE','SECURITY_POLICY','SECURITY_TEST','SECURITY_EVIDENCE']);
export const HOOK_TYPES=Object.freeze(['KNOWLEDGE','ORCHESTRATION','MONITORING','INTEGRATION','SECURITY','RELEASE','CONFORMANCE','MAINTENANCE']);
export const ARTIFACT_ACTIONS=Object.freeze(['VALIDATE','PREVIEW','QUALITY_GATE']);
export const STANDARD_CAPABILITIES=Object.freeze([
  'knowledge.taxonomy','knowledge.fingerprint','knowledge.validator','knowledge.resolver_signal','knowledge.pack_renderer',
  'orchestration.runtime_probe','orchestration.risk_signal','orchestration.startup_enricher','orchestration.instruction_stage','orchestration.action_classifier','orchestration.executor','orchestration.document_sync','orchestration.outbox_consumer','orchestration.fault_probe',
  'monitoring.collector','monitoring.metric_deriver','monitoring.alert_provider','monitoring.renderer','monitoring.exporter','monitoring.correlation_enricher',
  'integration.connector','integration.auth_strategy','integration.transport','integration.webhook','integration.error_normalizer',
  'security.vault_provider','security.signing_provider','security.trust_provider','security.sandbox_provider','security.dlp_provider','security.egress_provider','security.supply_chain_provider',
  'release.installer_provider','release.package_manager_provider','release.artifact_source','release.publication_adapter','release.migration_handler','release.attestation_exporter',
  'conformance.platform_probe','conformance.consumer_runner','conformance.sandbox_provider','conformance.fixture_provider','conformance.provider_adapter','conformance.evidence_transport',
  'maintenance.adapter','maintenance.precondition_provider','maintenance.reconciler','maintenance.checkpoint_provider','maintenance.quarantine_provider','maintenance.retention_provider','maintenance.drift_detector','maintenance.verifier',
  'domain.artifact_validator','domain.artifact_previewer','domain.quality_gate'
]);
