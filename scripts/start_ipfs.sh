#!/bin/sh
set -e

# 確保 /data/ipfs 目錄存在
mkdir -p /data/ipfs

# 將目錄擁有者變更為 ipfs 使用者
chown -R ipfs:ipfs /data/ipfs

# 切換到 ipfs 使用者身份並執行官方的啟動腳本
# 這個腳本會自動處理 'ipfs init' 和 'ipfs daemon'
exec su-exec ipfs /usr/local/bin/start_ipfs_daemon
