#!/bin/sh
set -e

# 如果 /data/geth/chaindata 不存在 => 第一次初始化
if [ ! -d "/data/geth/chaindata" ]; then
  geth --datadir /data init /genesis.json
fi

# 此處填寫您的簽名者地址
SIGNER="0x034f9688dE6Bf5709dA5C258b3825Cb01C5ae475"

exec geth --datadir /data \
  --networkid 15 \
  --http --http.addr 0.0.0.0 --http.port 8545 \
  --http.api "eth,net,web3,personal" \
  --nodiscover \
  --unlock "$SIGNER" \
  --allow-insecure-unlock \
  --keystore /data/keystore \
  --password /data/password.txt \
  --mine
