#!/bin/sh
set -ex

# 强制设置环境变量
export SIGNER="0x034f9688dE6Bf5709dA5C258b3825Cb01C5ae475"

if [ ! -d "/data/geth/chaindata" ]; then
  echo "▄︻デ=====初始化以太坊私有鏈=====══━一"
  geth --datadir /data init /genesis.json
fi

exec geth --datadir /data \
  --networkid 15 \
  --http --http.addr 0.0.0.0 --http.port 8545 \
  --http.api "eth,net,web3,personal,miner" \
  --nodiscover \
  --allow-insecure-unlock \
  --unlock "$SIGNER" \
  --password /data/password.txt \
  --mine \
  --miner.etherbase "$SIGNER" \
  --miner.gasprice 0 \
  --miner.gastarget 8000000
