#!/bin/sh
set -e

DATADIR="/geth/data"

# 建立 keystore 目錄（如果不存在）
mkdir -p "$DATADIR/keystore"

# 如果資料尚未初始化，則用 genesis.json 初始化創世區塊
if [ ! -d "$DATADIR/geth/chaindata" ]; then
  echo "Initializing genesis block..."
  geth --datadir "$DATADIR" init /geth/genesis.json
fi

# 如果 datadir 內沒有導入帳戶，則嘗試導入 keystore 文件
if [ -z "$(geth account list --datadir $DATADIR)" ]; then
  echo "Importing validator account..."
  geth --datadir "$DATADIR" account import /geth/keystore/UTC--2025-04-03T08-00-02.051862034Z--034f9688de6bf5709da5c258b3825cb01c5ae475 --password /geth/password.txt
fi

echo "Starting Geth node..."
exec geth --datadir "$DATADIR" --networkid 2025 \
  --http --http.addr "0.0.0.0" --http.port 8545 --http.api "eth,net,web3,clique,personal" \
  --ws --ws.addr "0.0.0.0" --ws.port 8546 --ws.api "eth,net,web3,clique" \
  --nodiscover --allow-insecure-unlock \
  --unlock "0x34f9688de6bf5709da5c258b3825cb01c5ae475" --password /geth/password.txt \
  --mine --miner.gaslimit 4700000 --miner.etherbase "0x34f9688de6bf5709da5c258b3825cb01c5ae475"
