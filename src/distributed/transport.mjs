import { DISTRIBUTED_VERSION } from './constants.mjs';
import { DistributedError } from './errors.mjs';
import { deepFreeze, requireString, safeId } from './util.mjs';

export function createDistributedTransportAdapter(input = {}) {
  const adapter = {
    distributed_transport_version: DISTRIBUTED_VERSION,
    transport_id: safeId(input.transport_id ?? 'transport', 'transport_id'),
    kind: requireString(input.kind ?? 'CUSTOM', 'kind').toUpperCase(),
    guarantees: deepFreeze({ delivery: input.guarantees?.delivery ?? 'AT_LEAST_ONCE', ordering: input.guarantees?.ordering ?? 'PARTITION_OPTIONAL', durability: input.guarantees?.durability ?? 'ADAPTER_DEFINED' }),
    publish: input.publish,
    claim: input.claim,
    acknowledge: input.acknowledge,
    fail: input.fail,
    health: input.health,
  };
  for (const fn of ['publish','claim','acknowledge','fail','health']) if (typeof adapter[fn] !== 'function') throw new DistributedError('DISTRIBUTED_TRANSPORT_CONTRACT_INVALID', fn);
  if (adapter.guarantees.delivery !== 'AT_LEAST_ONCE') throw new DistributedError('DISTRIBUTED_TRANSPORT_DELIVERY_GUARANTEE_INVALID');
  return deepFreeze(adapter);
}
