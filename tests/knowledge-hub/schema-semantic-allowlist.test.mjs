import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { validateKnowledgeHubSchemaSql } from '../../scripts/validate-knowledge-hub-schema-sql.mjs';

const VALID_SCHEMA = fs.readFileSync(new URL('./fixtures/phase0-schema.sql', import.meta.url), 'utf8');

const replace = (from, to) => {
  const changed = VALID_SCHEMA.replace(from, to);
  assert.notEqual(changed, VALID_SCHEMA, `fixture replacement must match: ${from}`);
  return changed;
};

test('trusted Phase-0 dump semantics are admitted and formatting is not identity-bearing', () => {
  const result = validateKnowledgeHubSchemaSql(VALID_SCHEMA);
  assert.match(result.schema_semantics_sha256, /^[a-f0-9]{64}$/);
  const reformatted = VALID_SCHEMA.replace('  key_id text NOT NULL,', '\n key_id   text   NOT NULL ,');
  assert.equal(validateKnowledgeHubSchemaSql(reformatted).schema_semantics_sha256, result.schema_semantics_sha256);
});

test('table column, order, type, nullability and inline action drift fail closed', () => {
  for (const candidate of [
    replace('  key_id text NOT NULL,', '  hostile text,\n  key_id text NOT NULL,'),
    replace('  key_id text NOT NULL,\n  subject_id text NOT NULL,', '  subject_id text NOT NULL,\n  key_id text NOT NULL,'),
    replace('  scopes_json jsonb NOT NULL,', '  scopes_json text NOT NULL,'),
    replace('  key_id text NOT NULL,', '  key_id text,'),
    replace('  status text NOT NULL,', "  status text NOT NULL DEFAULT 'ACTIVE',")
  ]) assert.throws(() => validateKnowledgeHubSchemaSql(candidate), /columns\/types\/nullability|allowlist/);
});

test('additional ALTER action, altered default and constraint body fail closed', () => {
  for (const candidate of [
    replace('ALTER TABLE ONLY public.client_policies ALTER COLUMN updated_at SET DEFAULT now();', 'ALTER TABLE ONLY public.client_policies ADD COLUMN hostile text;\nALTER TABLE ONLY public.client_policies ALTER COLUMN updated_at SET DEFAULT now();'),
    replace('ALTER TABLE ONLY public.client_policies ALTER COLUMN updated_at SET DEFAULT now();', 'ALTER TABLE ONLY public.client_policies ALTER COLUMN updated_at TYPE text;\nALTER TABLE ONLY public.client_policies ALTER COLUMN updated_at SET DEFAULT now();'),
    replace('SET DEFAULT now();', "SET DEFAULT '2026-08-16T00:00:00Z'::timestamp with time zone;"),
    replace("CHECK ((status = ANY (ARRAY['ACTIVE'::text, 'REVOKED'::text])))", 'CHECK (true)'),
    replace('ADD CONSTRAINT client_policies_pkey PRIMARY KEY (product_id);', 'ADD CONSTRAINT hostile UNIQUE (product_id);\nALTER TABLE ONLY public.client_policies ADD CONSTRAINT client_policies_pkey PRIMARY KEY (product_id);')
  ]) assert.throws(() => validateKnowledgeHubSchemaSql(candidate), /statement structure|default|constraint definition|allowlist/);
});

test('index key, method, uniqueness and predicate drift fail closed', () => {
  for (const candidate of [
    replace('USING btree (product_id, status);', 'USING btree (status, product_id);'),
    replace('USING btree (received_at);', 'USING hash (received_at);'),
    replace('CREATE INDEX evidence_events_received_at_idx', 'CREATE UNIQUE INDEX evidence_events_received_at_idx'),
    replace('(expires_at) WHERE (expires_at IS NOT NULL);', '(expires_at) WHERE (expires_at IS NULL);'),
    replace("((event_json ->> 'type'::text))", "((event_json ->> 'product'::text))")
  ]) assert.throws(() => validateKnowledgeHubSchemaSql(candidate), /index definition or predicate|statement structure|allowlist/);
});

test('TABLE DATA COPY and unapproved psql commands fail closed', () => {
  for (const command of [
    'COPY public.evidence_events (product_id) FROM stdin;',
    "COPY public.evidence_events TO '/tmp/events';",
    "COPY public.evidence_events TO PROGRAM 'id';"
  ]) assert.throws(() => validateKnowledgeHubSchemaSql(`${VALID_SCHEMA}\n${command}\n`), /TABLE DATA COPY command/);
  assert.throws(() => validateKnowledgeHubSchemaSql(VALID_SCHEMA.replace('\\restrict phase0guard', '\\set hostile on')), /unapproved psql command/);
  assert.throws(() => validateKnowledgeHubSchemaSql(VALID_SCHEMA.replace('\\unrestrict phase0guard', '\\unrestrict different')), /restrict guard/);
});

test('duplicate, missing, unknown and unterminated statements fail closed', () => {
  assert.throws(() => validateKnowledgeHubSchemaSql(`${VALID_SCHEMA}\nCREATE TABLE public.api_credentials (key_id text NOT NULL);\n`), /columns\/types\/nullability|exactly one/);
  assert.throws(() => validateKnowledgeHubSchemaSql(VALID_SCHEMA.replace(/CREATE TABLE public\.schema_migrations \([\s\S]*?\);\n/, '')), /exactly one table/);
  assert.throws(() => validateKnowledgeHubSchemaSql(`${VALID_SCHEMA}\nVACUUM public.evidence_events;\n`), /statement structure/);
  assert.throws(() => validateKnowledgeHubSchemaSql(`${VALID_SCHEMA}\nALTER TABLE public.evidence_events ADD COLUMN hostile text`), /lacks a terminator/);
});
