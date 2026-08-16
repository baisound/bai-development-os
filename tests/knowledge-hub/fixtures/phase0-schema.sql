\restrict phase0guard
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
SET default_tablespace = '';
SET default_table_access_method = heap;
CREATE SCHEMA public;
CREATE TABLE public.api_credentials (
  key_id text NOT NULL,
  subject_id text NOT NULL,
  product_id text NOT NULL,
  scopes_json jsonb NOT NULL,
  trust_level text NOT NULL,
  salt text NOT NULL,
  secret_hash text NOT NULL,
  status text NOT NULL,
  created_at timestamp with time zone NOT NULL,
  expires_at timestamp with time zone,
  revoked_at timestamp with time zone
);
CREATE TABLE public.client_policies (
  product_id text NOT NULL,
  policy_json jsonb NOT NULL,
  updated_at timestamp with time zone NOT NULL
);
CREATE TABLE public.delivery_receipts (
  receipt_id text NOT NULL,
  batch_id text NOT NULL,
  subject_id text NOT NULL,
  product_id text NOT NULL,
  transport text NOT NULL,
  receipt_json jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL
);
CREATE TABLE public.evidence_events (
  product_id text NOT NULL,
  installation_id text NOT NULL,
  event_id text NOT NULL,
  event_hash character(64) NOT NULL,
  event_json jsonb NOT NULL,
  knowledge_evidence_json jsonb NOT NULL,
  subject_id text NOT NULL,
  trust_level text NOT NULL,
  transport text NOT NULL,
  received_at timestamp with time zone NOT NULL,
  expires_at timestamp with time zone
);
CREATE TABLE public.schema_migrations (
  migration_name text NOT NULL,
  checksum character(64) NOT NULL,
  applied_at timestamp with time zone NOT NULL
);
ALTER TABLE ONLY public.client_policies ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE ONLY public.schema_migrations ALTER COLUMN applied_at SET DEFAULT now();
ALTER TABLE ONLY public.api_credentials ADD CONSTRAINT api_credentials_pkey PRIMARY KEY (key_id);
ALTER TABLE ONLY public.api_credentials ADD CONSTRAINT api_credentials_status_check CHECK ((status = ANY (ARRAY['ACTIVE'::text, 'REVOKED'::text])));
ALTER TABLE ONLY public.client_policies ADD CONSTRAINT client_policies_pkey PRIMARY KEY (product_id);
ALTER TABLE ONLY public.delivery_receipts ADD CONSTRAINT delivery_receipts_pkey PRIMARY KEY (receipt_id);
ALTER TABLE ONLY public.evidence_events ADD CONSTRAINT evidence_events_pkey PRIMARY KEY (product_id, installation_id, event_id);
ALTER TABLE ONLY public.schema_migrations ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (migration_name);
CREATE INDEX api_credentials_expires_at_idx ON public.api_credentials USING btree (expires_at) WHERE (expires_at IS NOT NULL);
CREATE INDEX api_credentials_product_status_idx ON public.api_credentials USING btree (product_id, status);
CREATE INDEX delivery_receipts_batch_idx ON public.delivery_receipts USING btree (product_id, batch_id);
CREATE INDEX evidence_events_expires_at_idx ON public.evidence_events USING btree (expires_at) WHERE (expires_at IS NOT NULL);
CREATE INDEX evidence_events_product_type_idx ON public.evidence_events USING btree (product_id, ((event_json ->> 'type'::text)));
CREATE INDEX evidence_events_received_at_idx ON public.evidence_events USING btree (received_at);
\unrestrict phase0guard
