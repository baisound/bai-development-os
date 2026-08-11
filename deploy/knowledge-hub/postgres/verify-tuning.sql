\pset pager off
SELECT name, setting, unit, source
FROM pg_settings
WHERE name IN (
  'max_connections',
  'shared_buffers',
  'effective_cache_size',
  'work_mem',
  'maintenance_work_mem',
  'autovacuum_work_mem',
  'checkpoint_timeout',
  'checkpoint_completion_target',
  'min_wal_size',
  'max_wal_size',
  'autovacuum',
  'autovacuum_max_workers',
  'autovacuum_naptime',
  'autovacuum_vacuum_scale_factor',
  'autovacuum_analyze_scale_factor',
  'track_io_timing',
  'password_encryption',
  'jit'
)
ORDER BY name;

SELECT current_setting('data_checksums') AS data_checksums,
       current_setting('server_version') AS server_version;
