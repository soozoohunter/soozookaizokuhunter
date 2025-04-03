#!/bin/sh
set -e

if [ ! -d "/data/geth/chaindata" ]; then
  geth --datadir /data init /genesis.json
fi

# 複製 keystore
# 讓 geth 能找到 keystore 在 /data/keystore
if [ -d "/data/keystore" ]; then
  echo "keystore found..."
fi

# 假設 signer address = 0xABCD1234...
# 請與 genesis.json allocate & extradata 相同
SIGNER="0xABCD1234ABCDEFAAAAAA..."

exec geth --datadir /data \
  --syncmode 'full' \
  --networkid 15 \
  --http --http.addr 0.0.0.0 --http.port 8545 \
  --http.api 'eth,net,web3,personal' \
  --nodiscover \
  --unlock "$SIGNER" \
  --allow-insecure-unlock \
  --keystore /data/keystore \
  --password /data/password.txt \
  --mine
