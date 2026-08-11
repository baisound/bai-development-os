# BAI Consumer Evidence Python Reference — RC2

Development-time reference only. Generated/copied source becomes Consumer-owned and has no BAI Development OS runtime dependency.

Canonical v1 flow: Product Event -> sanitizer/catalog -> LocalOutbox -> canonical Batch -> Hub or temporary Object Storage artifact. The same Event IDs survive retry/backfill. `artifact.py` builds provider-neutral artifact metadata/body. `object_storage.py` can PUT that body to a short-lived presigned URL using only the Python standard library; it contains no S3/AWS SDK and no long-lived storage credential. Redirects are rejected, HTTPS is mandatory outside explicit loopback tests, and successful Object Storage upload does **not** acknowledge/delete Local Outbox Events. Only a valid Knowledge Hub Delivery Receipt may do that.
