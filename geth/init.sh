#!/bin/sh
set -e

# 若尚未初始化，執行創世區塊初始化
if [ ! -d "/geth/data/geth/chaindata" ]; then
  geth --datadir /geth/data init /geth/genesis.json
fi

# 啟動 Geth 私有鏈節點
exec geth --datadir /geth/data --networkid 20250405 \
  --http --http.addr "0.0.0.0" --http.port 8545 \
  --http.api "db,eth,net,web3,personal,miner,clique" \
  --http.corsdomain "*" --allow-insecure-unlock \
  --unlock "0x034f9688dE6Bf5709dA5C258b3825Cb01C5ae475" \
  --password /geth/password.txt --mine --miner.gaslimit 4700000 \
  --miner.etherbase "0x034f9688dE6Bf5709dA5C258b3825Cb01C5ae475"
