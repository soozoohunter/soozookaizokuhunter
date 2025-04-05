#!/bin/sh
set -e

# 严格模式：检查必要文件存在性
if [ ! -f "/geth/genesis.json" ]; then
  echo "FATAL: genesis.json not found!" >&2
  exit 1
fi

if [ ! -d "/geth/keystore" ]; then
  echo "FATAL: keystore directory not found!" >&2
  exit 1
fi

if [ ! -f "/geth/password.txt" ]; then
  echo "FATAL: password.txt not found!" >&2
  exit 1
fi

# 初始化创世区块（仅首次运行）
if [ ! -d "/geth/data/geth/chaindata" ]; then
  echo "Initializing genesis block..."
  geth --datadir /geth/data init /geth/genesis.json
fi

# 启动节点（日志输出到标准错误）
exec geth --datadir /geth/data --networkid 20250405 \
  --http --http.addr "0.0.0.0" --http.port 8545 \
  --http.api "db,eth,net,web3,personal,miner,clique" \
  --http.corsdomain "*" --allow-insecure-unlock \
  --unlock "0x034f9688de6bf5709da5c258b3825cb01c5ae475" \
  --password /geth/password.txt --mine \
  --miner.gaslimit 4700000 \
  --miner.etherbase "0x034f9688de6bf5709da5c258b3825cb01c5ae475" \
  --verbosity 3 \
  --metrics \
  --metrics.addr 0.0.0.0 \
  --metrics.port 6060
