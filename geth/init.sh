#!/bin/sh
set -e

# 調試：檢查文件是否存在
echo "=== 容器內文件檢查 ==="
ls -l /data/keystore
cat /data/password.txt

# 初始化區塊鏈
if [ ! -d "/data/geth/chaindata" ]; then
  echo "初始化創世區塊..."
  geth --datadir /data init /genesis.json
fi

# 啟動 Geth（確保參數格式正確）
exec geth \
  --datadir /data \
  --networkid 15 \
  --http --http.addr 0.0.0.0 --http.port 8545 \
  --http.api eth,net,web3,personal \
  --nodiscover \
  --allow-insecure-unlock \
  --unlock "0x034f9688de6bf5709da5c258b3825cb01c5ae475,0xc8f98636ebb10dbcb216026db3dab527cf37c2ee" \
  --keystore /data/keystore \
  --password /data/password.txt \  # 必須是 --password 而非 -password
  --mine
