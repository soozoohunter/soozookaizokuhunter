#!/bin/sh
set -e

echo "=== 列出容器內檔案 /data/keystore ==="
ls -l /data/keystore

echo "=== 顯示 password.txt ==="
cat /data/password.txt

echo "=== 初始化創世區塊 (若尚未初始化) ==="
if [ ! -d "/data/geth/chaindata" ]; then
  geth --datadir /data init /genesis.json
fi

echo "=== 解鎖兩個簽名者，開始 PoA 挖礦 ==="
exec geth --datadir /data \
  --networkid 15 \
  --http --http.addr 0.0.0.0 --http.port 8545 \
  --http.api eth,net,web3,personal \
  --nodiscover \
  --allow-insecure-unlock \
  --unlock "0x034f9688de6bf5709da5c258b3825cb01c5ae475,0xc8f98636ebb10dbcb216026db3dab527cf37c2ee" \
  --keystore /data/keystore \
  --password /data/password.txt \
  --mine
