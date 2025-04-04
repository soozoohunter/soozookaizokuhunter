#!/bin/sh
set -e

# 首次初始化 genesis
if [ ! -d "/data/geth/chaindata" ]; then
  geth --datadir /data init /genesis.json
fi

# 解鎖 2 個帳戶，並自動挖礦 (Clique PoA)
exec geth --datadir /data \
  --networkid 15 \
  --http \
  --http.addr 0.0.0.0 \
  --http.port 8545 \
  --http.api "eth,net,web3,personal" \
  --nodiscover \
  --allow-insecure-unlock \
  --unlock "0x034f9688de6bf5709da5c258b3825cb01c5ae475,0xc8f98636ebb10dbcb216026db3dab527cf37c2ee" \
  --keystore /data/keystore \
  --password /data/password.txt \
  --mine
