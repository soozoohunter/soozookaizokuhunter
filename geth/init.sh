#!/bin/sh
set -e

echo "初始化 genesis 區塊（若尚未）..."
if [ ! -d "/data/geth/chaindata" ]; then
  geth --datadir /data init /genesis.json
fi

echo "啟動 geth 並解鎖單一簽名者..."
exec geth --datadir /data \
  --networkid 15 \
  --http --http.addr 0.0.0.0 --http.port 8545 \
  --http.api eth,net,web3,personal,miner \
  --nodiscover \
  --allow-insecure-unlock \
  --unlock "0x1a65ee6db9d49bb286c17a3f705354601cd1f61b" \
  --keystore /data/keystore \
  --password /data/password.txt \
  --mine \
  --miner.etherbase "0x1a65ee6db9d49bb286c17a3f705354601cd1f61b" \
  --miner.gasprice 0
