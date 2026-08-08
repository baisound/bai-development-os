export const INTEGRATION_VERSION = '1.0.0';
export const CONNECTOR_KINDS = Object.freeze(['GITHUB','MCP','EXTERNAL_AI','VIDEO','AUDIO','COMMUNICATION','STORAGE','WEBHOOK','GENERIC']);
export const CONNECTOR_STATUS = Object.freeze(['ENABLED','DISABLED','DEGRADED']);
export const SIDE_EFFECTS = Object.freeze(['NONE','REVERSIBLE','EXTERNAL','IRREVERSIBLE']);
export const TRUST_LEVELS = Object.freeze(['UNTRUSTED','REFERENCE','REVIEW_REQUIRED','VERIFIED']);
export const DATA_CLASSES = Object.freeze(['PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED']);
export const AUDIT_EVENTS = Object.freeze(['REQUEST_ACCEPTED','REQUEST_BLOCKED','EXECUTION_STARTED','RETRY_SCHEDULED','EXECUTION_SUCCEEDED','EXECUTION_FAILED','IDEMPOTENT_REPLAY']);
export const SENSITIVE_KEYS = Object.freeze(['authorization','password','passwd','secret','token','api_key','apikey','private_key','access_key','refresh_token','cookie','set-cookie']);
