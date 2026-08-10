# BAI Consumer Evidence Python Reference — RC2

Development-time reference only. Generated/copied source becomes Consumer-owned and has no BAI Development OS runtime dependency.

Canonical v1 flow: Product Event -> sanitizer/catalog -> LocalOutbox -> canonical Batch -> Hub or temporary Object Storage artifact. The same Event IDs survive retry/backfill. `artifact.py` only builds provider-neutral artifact metadata/body; it intentionally contains no S3/AWS SDK or credential storage.
