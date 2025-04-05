#!/bin/sh
set -e

# 严格文件检查
check_file() {
  if [ ! -f "$1" ]; then
    echo "FATAL: Missing $1 file!" >&2
    exit 1
  fi
}

check_dir() {
  if [ ! -d "$1" ]; then
    echo "FATAL: Missing $1 directory!" >&2
    exit 1
  fi
}

check_file "/geth/genesis.json"
check_dir "/geth/keystore"
check_file "/geth/password.txt"

# 初始化创世块（仅首次）
if [ ! -d "/geth/data/geth/chaindata" ]; then
  echo "Initializing genesis block..."
  geth --datadir /geth/data init /geth/genesis.json
fi

# 启动节点（启用详细日志）
exec geth \
  --datadir /geth/data \
  --networkid 20250405 \
  --http \
  --http.addr "0.0.0.0" \
  --http.port 8545 \
  --http.api "db,eth,net,web3,personal,miner,clique" \
  --http.corsdomain "*" \
  --allow-insecure-unlock \
  --unlock "0x034f9688de6bf5709da5c258b3825cb01c5ae475" \
  --password /geth/password.txt \
  --mine \
  --miner.gaslimit 4700000 \
  --miner.etherbase "0x034f9688de6bf5709da5c258b3825cb01c5ae475" \
  --verbosity 3 \
  --nodiscover \
  --syncmode "full"
