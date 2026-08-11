function required(env, name) {
  const value = env[name];
  if (typeof value !== 'string' || value.length < 1) throw new Error(`${name} is required`);
  return value;
}
function port(env) {
  const raw = env.PGPORT ?? '5432';
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 65535) throw new Error('PGPORT invalid');
  return value;
}

export function postgresPoolConfig(env = process.env, { max = 10, applicationName = 'bai-knowledge-hub' } = {}) {
  if (!Number.isInteger(max) || max < 1 || max > 100) throw new Error('PostgreSQL pool max invalid');
  const common = { max, application_name: applicationName };
  if (typeof env.DATABASE_URL === 'string' && env.DATABASE_URL.length > 0) {
    return { ...common, connectionString: env.DATABASE_URL };
  }
  return {
    ...common,
    host: required(env, 'PGHOST'),
    port: port(env),
    database: required(env, 'PGDATABASE'),
    user: required(env, 'PGUSER'),
    password: required(env, 'PGPASSWORD')
  };
}
