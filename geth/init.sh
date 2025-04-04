#!/bin/sh
set -e

# 第一次初始化：若 /data/geth/chaindata 不存在
if [ ! -d "/data/geth/chaindata" ]; then
  echo ">>> Initializing Geth with genesis.json..."
  geth --datadir /data init /genesis.json
fi

# 兩個簽名者帳戶（小寫版本）
SIGNER1="0x034f9688de6bf5709da5c258b3825cb01c5ae475"
SIGNER2="0xc8f98636ebb10dbcb216026db3dab527cf37c2ee"

echo ">>> Using signer 1: $SIGNER1"
echo ">>> Using signer 2: $SIGNER2"

# 正式啟動 Geth (Clique PoA)，並自動解鎖 signer1 & signer2
exec geth --datadir /data \
  --networkid 15 \
  --syncmode 'full' \
  --http --http.addr 0.0.0.0 --http.port 8545 \
  --http.api 'eth,net,web3,personal' \
  --nodiscover \
  --unlock "$SIGNER1,$SIGNER2" \
  --password /data/password.txt \
  --allow-insecure-unlock \
  --mine
