#!/usr/bin/env bash
set -euo pipefail

echo "$(date) - Starting custom Milvus startup script..."
echo "ETCD_ENDPOINTS=${ETCD_ENDPOINTS:-}"
echo "MINIO_ADDRESS=${MINIO_ADDRESS:-}"

LOCK_DIR=/var/lib/milvus
# 清理殘留鎖檔，避免啟動錯誤
rm -f "$LOCK_DIR/rdb_data_meta_kv/LOCK" || true
rm -f "$LOCK_DIR/rdb_data"/*.lock    || true

# 等待依賴服務可用
wait_for() {
  local name=$1 url=$2
  echo "$(date) - Waiting for $name at $url ..."
  until curl -fs "$url" >/dev/null 2>&1; do
    sleep 2
  done
  echo "$(date) - $name is available"
}

wait_for "etcd"  "http://${ETCD_ENDPOINTS}/health"
wait_for "minio" "http://${MINIO_ADDRESS}/minio/health/ready"

echo "$(date) - Launching Milvus in standalone mode..."
exec milvus run standalone
