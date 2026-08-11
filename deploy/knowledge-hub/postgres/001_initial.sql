CREATE TABLE IF NOT EXISTS evidence_events (
  product_id text NOT NULL,
  installation_id text NOT NULL,
  event_id text NOT NULL,
  event_hash char(64) NOT NULL,
  event_json jsonb NOT NULL,
  knowledge_evidence_json jsonb NOT NULL,
  subject_id text NOT NULL,
  trust_level text NOT NULL,
  transport text NOT NULL,
  received_at timestamptz NOT NULL,
  expires_at timestamptz NULL,
  PRIMARY KEY (product_id, installation_id, event_id)
);

CREATE INDEX IF NOT EXISTS evidence_events_received_at_idx ON evidence_events(received_at);
CREATE INDEX IF NOT EXISTS evidence_events_expires_at_idx ON evidence_events(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS evidence_events_product_type_idx ON evidence_events(product_id, ((event_json->>'type')));

CREATE TABLE IF NOT EXISTS delivery_receipts (
  receipt_id text PRIMARY KEY,
  batch_id text NOT NULL,
  subject_id text NOT NULL,
  product_id text NOT NULL,
  transport text NOT NULL,
  receipt_json jsonb NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS delivery_receipts_batch_idx ON delivery_receipts(product_id, batch_id);

CREATE TABLE IF NOT EXISTS client_policies (
  product_id text PRIMARY KEY,
  policy_json jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
