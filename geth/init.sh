#!/bin/sh

# 第一次初始化私有鏈
geth --datadir /data init /genesis.json

# 正式啟動 geth 節點
exec geth --datadir /data \
  --http \
  --http.addr "0.0.0.0" \
  --http.port 8545 \
  --http.api "eth,net,web3,personal" \
  --nodiscover \
  --networkid 15
