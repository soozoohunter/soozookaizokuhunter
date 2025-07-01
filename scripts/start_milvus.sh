#!/bin/bash
set -e
LOCK_DIR=/var/lib/milvus
# remove any leftover RocksMQ lock files that might prevent startup
find "$LOCK_DIR" -name LOCK -exec rm -f {} \; || true
find "$LOCK_DIR" -name '*.lock' -exec rm -f {} \; || true
exec milvus run standalone
