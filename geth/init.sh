#!/bin/sh
set -e

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
  --unlock "0x75f4ba6a6ba55817324509bf73256e89a836e815" \
  --keystore /data/keystore \
  --password /data/password.txt \
  --mine
