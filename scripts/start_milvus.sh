#!/bin/bash
set -e
LOCK_DIR=/var/lib/milvus
# remove possible leftover RocksMQ lock files
rm -f "$LOCK_DIR/rdb_data_meta_kv/LOCK" || true
rm -f "$LOCK_DIR/rdb_data"/*.lock || true
exec milvus run standalone
