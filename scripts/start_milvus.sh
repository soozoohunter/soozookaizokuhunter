#!/bin/sh
set -euo pipefail

echo "Starting custom Milvus script..."
echo "ETCD_ENDPOINTS=${ETCD_ENDPOINTS:-}"
echo "MINIO_ADDRESS=${MINIO_ADDRESS:-}"

LOCK_DIR=/var/lib/milvus

# Remove possible leftover RocksMQ lock files to avoid startup errors
rm -f "$LOCK_DIR/rdb_data_meta_kv/LOCK" || true
rm -f "$LOCK_DIR/rdb_data"/*.lock || true

# Wait for dependency services before launching Milvus
wait_for() {
  local name=$1
  local url=$2
  echo "Waiting for $name at $url ..."
  # Loop for 2 minutes (60 * 2 seconds)
  for i in $(seq 1 60); do
    if curl -fs "$url" >/dev/null 2>&1; then
      echo "$name is available."
      return 0
    fi
    sleep 2
  done
  echo "ERROR: $name was not available after 2 minutes."
  return 1
}

echo "$(date) - Waiting for etcd service..."
wait_for "etcd" "http://${ETCD_ENDPOINTS}/health"

echo "$(date) - Waiting for MinIO service..."
wait_for "minio" "http://${MINIO_ADDRESS}/minio/health/ready"

echo "$(date) - Starting Milvus in standalone mode"
# Use exec for proper signal handling
exec milvus run standalone
