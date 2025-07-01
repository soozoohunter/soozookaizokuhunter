#!/bin/sh

# 腳本將在 MinIO 服務啟動後自動執行

echo "Executing MinIO initialization script..."

# 使用 'mc' (MinIO Client) 設定本地 MinIO 服務的別名
# 在容器內部，主機是 'localhost'，認證信息來自環境變數
/usr/bin/mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"

# 建立儲存桶，如果已存在則忽略錯誤
/usr/bin/mc mb "local/$MINIO_BUCKET_NAME" || exit 0

# 設定儲存桶的存取策略為 'public'
/usr/bin/mc policy set public "local/$MINIO_BUCKET_NAME"

echo "MinIO initialization script finished."

exit 0
