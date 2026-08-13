import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import {
  createContextCostRecord,
  validateContextCostRecord,
} from '../../src/context-control/index.mjs';

const source = (source_id, estimated_tokens, extra = {}) => ({
  source_id,
  source_type: 'REPOSITORY_FILE',
  path_or_ref: `registry/${source_id}.md`,
  sha256: `sha256:${createHash('sha256').update(source_id).digest('hex')}`,
  estimated_tokens,
  observed_tokens: null,
  selected_reason: 'canonical route',
  mandatory: false,
  cacheable: true,
  changed_since_previous_session: false,
  used_in_decision: true,
  used_in_patch: false,
  duplicate_of: null,
  stale: false,
  trust_level: 'CANONICAL',
  ...extra,
});

const baseline = (extra = {}) => ({
  record_id: 'CCR-TASK-018-001',
  task_id: 'TASK-018',
  session_id: 'session-001',
  phase: 'PHASE_B',
  recorded_at: '2026-08-13T00:00:00.000Z',
  confidence: 'LOCAL_TOKENIZER_ESTIMATE',
  sources: [source('a', 600), source('b', 400)],
  usage: {
    observed_input_tokens: null,
    observed_cached_input_tokens: null,
    observed_output_tokens: null,
    billed_tokens: null,
  },
  quality_gate: { status: 'PASS', gate_id: 'CONTEXT_OBSERVABILITY_MVP_PASS' },
  repeated_overfetch_count: 0,
  ...extra,
});

test('builds an immutable deterministic record and validates its checksum', () => {
  const first = createContextCostRecord(baseline());
  const second = createContextCostRecord(baseline());
  assert.deepEqual(first, second);
  assert.equal(first.usage.estimated_input_tokens, 1000);
  assert.equal(first.usage.observed_input_tokens, null);
  assert.equal(first.usage.billed_tokens, null);
  assert.equal(first.efficiency.score, 100);
  assert.equal(validateContextCostRecord(first).result, 'CONTEXT_COST_RECORD_VALID');
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.sources));
  assert.ok(Object.isFrozen(first.sources[0]));
});

test('keeps estimate, provider observation, cache and billing values distinct', () => {
  const record = createContextCostRecord(baseline({
    confidence: 'EXACT_PROVIDER_REPORTED',
    usage: {
      observed_input_tokens: 920,
      observed_cached_input_tokens: 700,
      observed_output_tokens: 180,
      billed_tokens: 400,
    },
  }));
  assert.deepEqual(record.usage, {
    estimated_input_tokens: 1000,
    observed_input_tokens: 920,
    observed_cached_input_tokens: 700,
    observed_output_tokens: 180,
    billed_tokens: 400,
  });
});

test('rejects exact-provider confidence without observed usage', () => {
  assert.throws(
    () => createContextCostRecord(baseline({ confidence: 'EXACT_PROVIDER_REPORTED' })),
    (error) => error.code === 'CONTEXT_COST_OBSERVED_USAGE_REQUIRED',
  );
});

test('unknown usage stays null and unavailable confidence cannot claim usage', () => {
  const record = createContextCostRecord(baseline({
    confidence: 'UNAVAILABLE',
    sources: [source('a', 0, { observed_tokens: null })],
    quality_gate: { status: 'UNKNOWN', gate_id: null },
  }));
  assert.equal(record.usage.observed_input_tokens, null);
  assert.equal(record.efficiency.status, 'UNAVAILABLE');
  assert.equal(record.efficiency.score, null);
  assert.throws(
    () => createContextCostRecord(baseline({
      confidence: 'UNAVAILABLE',
      usage: {
        observed_input_tokens: 0,
        observed_cached_input_tokens: null,
        observed_output_tokens: null,
        billed_tokens: null,
      },
    })),
    (error) => error.code === 'CONTEXT_COST_SCHEMA_INVALID',
  );
});

test('classifies warning, major and repeated critical overfetch', () => {
  const inputs = [
    { avoidable: 1, repeat: 0, expected: 'INFO' },
    { avoidable: 100, repeat: 0, expected: 'WARNING' },
    { avoidable: 250, repeat: 0, expected: 'MAJOR' },
    { avoidable: 500, repeat: 1, expected: 'MAJOR' },
    { avoidable: 500, repeat: 2, expected: 'CRITICAL' },
  ];
  for (const item of inputs) {
    const record = createContextCostRecord(baseline({
      sources: [
        source('used', 1000 - item.avoidable),
        source('unused', item.avoidable, {
          used_in_decision: false,
          used_in_patch: false,
        }),
      ],
      repeated_overfetch_count: item.repeat,
    }));
    assert.equal(record.findings[0].severity, item.expected);
  }
});

test('unknown use is not silently treated as unused or avoidable', () => {
  const record = createContextCostRecord(baseline({
    sources: [source('unknown', 1000, {
      used_in_decision: null,
      used_in_patch: null,
    })],
  }));
  assert.equal(record.metrics.avoidable_tokens, 0);
  assert.deepEqual(record.findings, []);
});

test('deduplicates avoidable token union while preserving component ratios', () => {
  const record = createContextCostRecord(baseline({
    sources: [
      source('canonical', 500),
      source('duplicate', 500, {
        duplicate_of: 'canonical',
        stale: true,
        used_in_decision: false,
        used_in_patch: false,
      }),
    ],
  }));
  assert.equal(record.metrics.duplicate_tokens, 500);
  assert.equal(record.metrics.stale_tokens, 500);
  assert.equal(record.metrics.avoidable_tokens, 500);
  assert.equal(record.metrics.avoidable_ratio, 0.5);
});

test('quality failure forces zero efficiency and unknown quality keeps it unavailable', () => {
  const failed = createContextCostRecord(baseline({
    quality_gate: { status: 'FAIL', gate_id: 'unit-tests' },
  }));
  const unknown = createContextCostRecord(baseline({
    quality_gate: { status: 'UNKNOWN', gate_id: null },
  }));
  assert.equal(failed.efficiency.score, 0);
  assert.equal(unknown.efficiency.score, null);
});

test('validates policy ordering and cached token bounds', () => {
  assert.throws(
    () => createContextCostRecord(baseline(), {
      overfetch_policy: { warning_ratio: 0.4, major_ratio: 0.3 },
    }),
    (error) => error.code === 'CONTEXT_OVERFETCH_POLICY_INVALID',
  );
  assert.throws(
    () => createContextCostRecord(baseline({
      confidence: 'EXACT_PROVIDER_REPORTED',
      usage: {
        observed_input_tokens: 10,
        observed_cached_input_tokens: 11,
        observed_output_tokens: null,
        billed_tokens: null,
      },
    })),
    (error) => error.code === 'CONTEXT_COST_SCHEMA_INVALID',
  );
});

test('rejects missing duplicate targets and duplicate source identities', () => {
  assert.throws(
    () => createContextCostRecord(baseline({
      sources: [source('a', 10, { duplicate_of: 'missing' })],
    })),
    (error) => error.code === 'CONTEXT_COST_SCHEMA_INVALID',
  );
  assert.throws(
    () => createContextCostRecord(baseline({ sources: [source('a', 10), source('a', 10)] })),
    (error) => error.code === 'CONTEXT_COST_SCHEMA_INVALID',
  );
});

test('tampering with a derived metric is detected even with the original checksum', () => {
  const record = createContextCostRecord(baseline());
  const tampered = structuredClone(record);
  tampered.metrics.useful_tokens = 0;
  assert.throws(
    () => validateContextCostRecord(tampered),
    (error) => error.code === 'CONTEXT_COST_RECORD_TAMPERED',
  );
});
