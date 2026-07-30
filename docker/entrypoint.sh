#!/bin/sh
set -e

# MySQL akzeptiert bei einem frischen Volume ggf. schon TCP-Verbindungen,
# bevor die Datenbank selbst vollständig initialisiert ist - daher hier
# noch mit ein paar Versuchen abgesichert, obwohl compose bereits per
# healthcheck auf "mysqladmin ping" wartet.
ATTEMPTS=0
MAX_ATTEMPTS=10

until npx prisma migrate deploy; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    echo "prisma migrate deploy failed after $MAX_ATTEMPTS attempts, aborting."
    exit 1
  fi
  echo "prisma migrate deploy failed, retrying in 3s... ($ATTEMPTS/$MAX_ATTEMPTS)"
  sleep 3
done

exec node server.js
