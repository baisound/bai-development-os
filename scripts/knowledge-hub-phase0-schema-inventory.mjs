// Trusted Phase-0 PostgreSQL schema inventory. This file is deliberately
// separate from the validator: changing a migration or the migration bootstrap
// requires an explicit review of both the source digest and its dump semantics.
export const KNOWLEDGE_HUB_PHASE0_SCHEMA_INVENTORY = Object.freeze({
  revision: 1,
  sources: Object.freeze([
    Object.freeze({ path: 'deploy/knowledge-hub/postgres/001_initial.sql', sha256: '8e55eecd7d2d061908ba26d16c97b2cdd55070cfc24f8aad74f10bcb7a468ffb' }),
    Object.freeze({ path: 'deploy/knowledge-hub/postgres/002_auth_and_operations.sql', sha256: '5424749b1eec72bea1b3d9aef4d834f6c3f8866f700564e6d86c879c5289d469' }),
    Object.freeze({ path: 'src/knowledge-hub/postgres-migrations.mjs', sha256: 'd0bfce6e7db7cf4a771f06d6f28daa45354ae3dc92f02bb31a53ca0221873025' })
  ]),
  tables: Object.freeze({
    api_credentials: Object.freeze([
      'key_id text NOT NULL', 'subject_id text NOT NULL', 'product_id text NOT NULL',
      'scopes_json jsonb NOT NULL', 'trust_level text NOT NULL', 'salt text NOT NULL',
      'secret_hash text NOT NULL', 'status text NOT NULL',
      'created_at timestamp with time zone NOT NULL', 'expires_at timestamp with time zone',
      'revoked_at timestamp with time zone'
    ]),
    client_policies: Object.freeze([
      'product_id text NOT NULL', 'policy_json jsonb NOT NULL',
      'updated_at timestamp with time zone NOT NULL'
    ]),
    delivery_receipts: Object.freeze([
      'receipt_id text NOT NULL', 'batch_id text NOT NULL', 'subject_id text NOT NULL',
      'product_id text NOT NULL', 'transport text NOT NULL', 'receipt_json jsonb NOT NULL',
      'created_at timestamp with time zone NOT NULL'
    ]),
    evidence_events: Object.freeze([
      'product_id text NOT NULL', 'installation_id text NOT NULL', 'event_id text NOT NULL',
      'event_hash character(64) NOT NULL', 'event_json jsonb NOT NULL',
      'knowledge_evidence_json jsonb NOT NULL', 'subject_id text NOT NULL',
      'trust_level text NOT NULL', 'transport text NOT NULL',
      'received_at timestamp with time zone NOT NULL', 'expires_at timestamp with time zone'
    ]),
    schema_migrations: Object.freeze([
      'migration_name text NOT NULL', 'checksum character(64) NOT NULL',
      'applied_at timestamp with time zone NOT NULL'
    ])
  }),
  defaults: Object.freeze({
    'client_policies.updated_at': 'now()',
    'schema_migrations.applied_at': 'now()'
  }),
  constraints: Object.freeze({
    api_credentials_pkey: Object.freeze({ table: 'api_credentials', definition: 'PRIMARY KEY (key_id)' }),
    api_credentials_status_check: Object.freeze({ table: 'api_credentials', definition: "CHECK ((status = ANY (ARRAY['ACTIVE'::text, 'REVOKED'::text])))" }),
    client_policies_pkey: Object.freeze({ table: 'client_policies', definition: 'PRIMARY KEY (product_id)' }),
    delivery_receipts_pkey: Object.freeze({ table: 'delivery_receipts', definition: 'PRIMARY KEY (receipt_id)' }),
    evidence_events_pkey: Object.freeze({ table: 'evidence_events', definition: 'PRIMARY KEY (product_id, installation_id, event_id)' }),
    schema_migrations_pkey: Object.freeze({ table: 'schema_migrations', definition: 'PRIMARY KEY (migration_name)' })
  }),
  indexes: Object.freeze({
    api_credentials_expires_at_idx: Object.freeze({ table: 'api_credentials', keys: 'expires_at', predicate: '(expires_at IS NOT NULL)' }),
    api_credentials_product_status_idx: Object.freeze({ table: 'api_credentials', keys: 'product_id, status', predicate: null }),
    delivery_receipts_batch_idx: Object.freeze({ table: 'delivery_receipts', keys: 'product_id, batch_id', predicate: null }),
    evidence_events_expires_at_idx: Object.freeze({ table: 'evidence_events', keys: 'expires_at', predicate: '(expires_at IS NOT NULL)' }),
    evidence_events_product_type_idx: Object.freeze({ table: 'evidence_events', keys: "product_id, ((event_json ->> 'type'::text))", predicate: null }),
    evidence_events_received_at_idx: Object.freeze({ table: 'evidence_events', keys: 'received_at', predicate: null })
  })
});

const tableNames = Object.freeze(Object.keys(KNOWLEDGE_HUB_PHASE0_SCHEMA_INVENTORY.tables).sort());

// pg_restore's archive coordinates are derived from the same reviewed semantic
// inventory used by the schema-SQL validator.  A migration revision therefore
// cannot advance the SQL and TOC allowlists independently.
export const KNOWLEDGE_HUB_PHASE0_TOC_COORDINATES = Object.freeze([
  'ENCODING - ENCODING',
  'STDSTRINGS - STDSTRINGS',
  'SEARCHPATH - SEARCHPATH',
  'SCHEMA - public',
  ...tableNames.flatMap((name) => [`TABLE public ${name}`, `TABLE DATA public ${name}`]),
  ...Object.keys(KNOWLEDGE_HUB_PHASE0_SCHEMA_INVENTORY.defaults).sort().map((coordinate) => {
    const [table, column] = coordinate.split('.');
    return `DEFAULT public ${table} ${column}`;
  }),
  ...Object.entries(KNOWLEDGE_HUB_PHASE0_SCHEMA_INVENTORY.constraints).sort(([left], [right]) => left.localeCompare(right, 'en')).map(([name, value]) => `CONSTRAINT public ${value.table} ${name}`),
  ...Object.keys(KNOWLEDGE_HUB_PHASE0_SCHEMA_INVENTORY.indexes).sort().map((name) => `INDEX public ${name}`),
  'PRE_DATA_BOUNDARY - PRE_DATA_BOUNDARY',
  'POST_DATA_BOUNDARY - POST_DATA_BOUNDARY'
]);

if (KNOWLEDGE_HUB_PHASE0_TOC_COORDINATES.length !== 30 || new Set(KNOWLEDGE_HUB_PHASE0_TOC_COORDINATES).size !== 30) {
  throw new Error('Phase-0 schema inventory must derive exactly 30 unique TOC coordinates');
}
