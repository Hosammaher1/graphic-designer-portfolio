#!/bin/sh
set -e

echo "==> Starting Graphic Designer Portfolio API on Render..."

# Cache configuration, routes, and views if APP_KEY is present
if [ -n "$APP_KEY" ]; then
    echo "==> Optimizing Laravel cache for production..."
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
fi

# Ensure storage symlink exists
[ -L public/storage ] || php artisan storage:link || true

# Run database migrations safely in production if DB is configured
if [ -n "$DATABASE_URL" ] || [ -n "$DB_HOST" ]; then
    echo "==> Running production migrations..."
    php artisan migrate --force || echo "Migration warning: DB not reachable or already up to date."
fi

# Determine port (Render provides $PORT)
PORT="${PORT:-8000}"

echo "==> Starting web server on port ${PORT} with 50M upload limits..."
exec php -d upload_max_filesize=50M -d post_max_size=50M -d memory_limit=256M -d max_execution_time=120 artisan serve --host=0.0.0.0 --port="${PORT}"
