#!/bin/sh
set -e

# 如果 /data/geth/chaindata 不存在 => 第一次初始化
if [ ! -d "/data/geth/chaindata" ]; then
  geth --datadir /data init /genesis.json
fi

# 2 個簽名者地址 (小寫)
SIGNER1="0x034f9688de6bf5709da5c258b3825cb01c5ae475"
SIGNER2="0xc8f98636ebb10dbcb216026db3dab527cf37c2ee"

exec geth --datadir /data \
  --networkid 15 \
  --http --http.addr 0.0.0.0 --http.port 8545 \
  --http.api "eth,net,web3,personal" \
  --nodiscover \
  --unlock "$SIGNER1" --unlock "$SIGNER2" \
  --allow-insecure-unlock \
  --keystore /data/keystore \
  --password /data/password.txt \
  --mine
