#!/bin/bash
set -e

echo "Running database migrations..."
node -e "
  import('@nanolog/db').then(({ migrate }) =>
    migrate(process.env.DATABASE_URL)
  ).then(() => console.log('Migrations complete'))
  .catch(err => { console.error(err); process.exit(1); });
"

echo "Starting web server..."
exec node apps/web/build/index.js
