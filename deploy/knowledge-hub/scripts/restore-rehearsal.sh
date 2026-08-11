#!/bin/sh
set -eu
: "${PGHOST:?PGHOST required}"
: "${PGPORT:=5432}"
: "${PGUSER:?PGUSER required}"
: "${BACKUP_FILE:?BACKUP_FILE required}"
: "${RESTORE_TARGET_DATABASE:?RESTORE_TARGET_DATABASE required}"
: "${BAI_RESTORE_ACK:?set BAI_RESTORE_ACK=REHEARSAL_ONLY}"
[ "$BAI_RESTORE_ACK" = "REHEARSAL_ONLY" ] || { echo "Refusing restore without rehearsal acknowledgement" >&2; exit 2; }
case "$RESTORE_TARGET_DATABASE" in
  *_restore_rehearsal) ;;
  *) echo "RESTORE_TARGET_DATABASE must end with _restore_rehearsal" >&2; exit 2 ;;
esac
[ -f "$BACKUP_FILE" ] || { echo "Backup file not found" >&2; exit 2; }
if [ -f "$BACKUP_FILE.sha256" ]; then (cd "$(dirname "$BACKUP_FILE")" && sha256sum -c "$(basename "$BACKUP_FILE").sha256"); fi
createdb --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" "$RESTORE_TARGET_DATABASE"
pg_restore --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" --dbname="$RESTORE_TARGET_DATABASE" --no-owner --no-acl "$BACKUP_FILE"
printf 'restore_rehearsal_database=%s\n' "$RESTORE_TARGET_DATABASE"
