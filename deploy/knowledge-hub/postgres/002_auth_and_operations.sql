CREATE TABLE IF NOT EXISTS api_credentials (
  key_id text PRIMARY KEY,
  subject_id text NOT NULL,
  product_id text NOT NULL,
  scopes_json jsonb NOT NULL,
  trust_level text NOT NULL,
  salt text NOT NULL,
  secret_hash text NOT NULL,
  status text NOT NULL CHECK (status IN ('ACTIVE','REVOKED')),
  created_at timestamptz NOT NULL,
  expires_at timestamptz NULL,
  revoked_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS api_credentials_product_status_idx
  ON api_credentials(product_id, status);
CREATE INDEX IF NOT EXISTS api_credentials_expires_at_idx
  ON api_credentials(expires_at) WHERE expires_at IS NOT NULL;
