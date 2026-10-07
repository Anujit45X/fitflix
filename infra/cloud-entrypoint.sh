#!/bin/sh
set -eu
if [ -z "${DATABASE_URL:-}" ]; then
  : "${PGHOST:?PGHOST required}" "${PGPORT:?PGPORT required}" "${PGDATABASE:?PGDATABASE required}"
  export DATABASE_URL="jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}"
fi
export APP_ORIGIN="${APP_ORIGIN:-${RENDER_EXTERNAL_URL:?APP_ORIGIN or RENDER_EXTERNAL_URL required}}"
exec java -jar /app/app.jar "$@"
