#!/bin/bash
# 開啟詳細追蹤模式，每行執行過的指令都會被印出
set -x

echo "--- MILVUS DEBUG SCRIPT STARTED ---"
echo "--- Running as user: $(whoami) ---"
echo "--- PATH is: $PATH ---"
echo "--- Checking for milvus executable: $(which milvus) ---"

# ----- 原腳本內容開始 -----

echo "Starting custom Milvus script..."
echo "ETCD_ENDPOINTS=${ETCD_ENDPOINTS:-}"
echo "MINIO_ADDRESS=${MINIO_ADDRESS:-}"

LOCK_DIR=/var/lib/milvus

echo "Attempting to remove lock files..."
rm -f "$LOCK_DIR/rdb_data_meta_kv/LOCK" || true
rm -f "$LOCK_DIR/rdb_data"/*.lock || true
echo "Lock file removal finished."

wait_for() {
  local name=$1
  local url=$2
  echo "Waiting for $name at $url ..."
  # 增加超時機制，避免無限等待
  for i in $(seq 1 60); do
    if curl -fs "$url" >/dev/null 2>&1; then
      echo "$name is available."
      return 0
    fi
    # 每2秒印一個點，表示正在等待
    echo -n "."
    sleep 2
  done
  echo " FAILED. $name was not available after 2 minutes."
  return 1
}

echo "$(date) - Waiting for etcd service..."
wait_for "etcd" "http://${ETCD_ENDPOINTS}/health"

echo "$(date) - Waiting for MinIO service..."
wait_for "minio" "http://${MINIO_ADDRESS}/minio/health/ready"

echo "$(date) - Starting Milvus in standalone mode (without exec for debugging)"
# 暫時移除 exec，讓我們觀察後續輸出
milvus run standalone

echo "--- SCRIPT ENDED --- (This message should not be reached if milvus runs correctly in foreground)"
