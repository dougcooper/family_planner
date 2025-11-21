#!/bin/sh
set -e

# Run migrations
/app/scripts/migrate.sh

# Start the application
exec npm run dev
