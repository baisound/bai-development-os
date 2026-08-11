#!/bin/sh
set -eu
: "${PGHOST:?PGHOST required}"
: "${PGPORT:=5432}"
: "${PGDATABASE:?PGDATABASE required}"
: "${PGUSER:?PGUSER required}"
: "${BACKUP_DIR:?BACKUP_DIR required}"
umask 077
mkdir -p "$BACKUP_DIR"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
out="$BACKUP_DIR/knowledge-hub-$stamp.dump"
pg_dump --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" --dbname="$PGDATABASE" --format=custom --no-owner --no-acl --file="$out"
sha256sum "$out" > "$out.sha256"
printf '%s\n' "$out"
