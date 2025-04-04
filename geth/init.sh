#!/bin/sh
set -e

# 如首次啟動，初始化私有鏈
if [ ! -d "/data/geth/chaindata" ]; then
  geth --datadir /data init /genesis.json
fi

# 正確解鎖兩個帳戶（與 keystore 同地址、小寫）
exec geth --datadir /data \
  --networkid 15 \
  --syncmode "full" \
  --http --http.addr "0.0.0.0" --http.port 8545 \
  --http.api "eth,net,web3,personal" \
  --nodiscover \
  --allow-insecure-unlock \
  --unlock "0x034f9688de6bf5709da5c258b3825cb01c5ae475,0xc8f98636ebb10dbcb216026db3dab527cf37c2ee" \
  --keystore /data/keystore \
  --password /data/password.txt \
  --mine
