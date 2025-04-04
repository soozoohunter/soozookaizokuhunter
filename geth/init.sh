#!/bin/sh
set -e

# 如果尚未初始化，則用 genesis.json 初始化區塊鏈
if [ ! -d "/data/geth/chaindata" ]; then
  echo "初始化 genesis 區塊..."
  geth --datadir /data init /genesis.json
fi

echo "啟動 Geth 節點並解鎖帳戶..."
exec geth --datadir /data \
  --networkid 15 \
  --http --http.addr 0.0.0.0 --http.port 8545 \
  --http.api eth,net,web3,personal \
  --nodiscover \
  --allow-insecure-unlock \
  --unlock "0x7b74883b039dd129b67c243cf376c816bdd81dde" \
  --keystore /data/keystore \
  --password /data/password.txt \
  --mine
