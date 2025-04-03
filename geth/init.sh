#!/bin/sh
set -e

# 如無 /data/geth/chaindata 則初始化
if [ ! -d "/data/geth/chaindata" ]; then
  geth --datadir /data init /genesis.json
fi

# 正式啟動 + 自動挖礦
exec geth --datadir /data \
  --http \
  --http.addr 0.0.0.0 \
  --http.port 8545 \
  --http.api "eth,net,web3,personal" \
  --nodiscover \
  --networkid 15 \
  --allow-insecure-unlock \
  --mine \
  --miner.threads 1
