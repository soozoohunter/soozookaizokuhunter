#!/bin/bash
set -e

echo "Starting custom Milvus script..."
echo "ETCD_ENDPOINTS=${ETCD_ENDPOINTS}"
echo "MINIO_ADDRESS=${MINIO_ADDRESS}"

LOCK_DIR=/var/lib/milvus
rm -f "$LOCK_DIR/rdb_data_meta_kv/LOCK" || true
rm -f "$LOCK_DIR/rdb_data"/*.lock || true

wait_for() {
name=$1; url=$2
echo "Waiting for $name at $url..."
until curl -fs "$url" &>/dev/null; do
sleep 2
done
}

wait_for "etcd" "http://${ETCD_ENDPOINTS}/health"
wait_for "minio" "http://${MINIO_ADDRESS}/minio/health/ready"

exec milvus run standalone
