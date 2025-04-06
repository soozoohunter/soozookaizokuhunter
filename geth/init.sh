#!/bin/sh
set -e

DATA_DIR="/geth/data"

if [ ! -d "$DATA_DIR/geth/chaindata" ]; then
  echo "Initializing genesis block..."
  geth --datadir "$DATA_DIR" init /geth/genesis.json
fi

echo "Starting Geth node..."
exec geth --datadir "$DATA_DIR" --networkid 20250405 \
  --http --http.addr "0.0.0.0" --http.port 8545 --http.api "db,eth,net,web3,personal,miner,clique" \
  --nodiscover --allow-insecure-unlock \
  --unlock "0x34f9688de6bf5709da5c258b3825cb01c5ae475" --password /geth/password.txt \
  --mine --miner.gaslimit 4700000 --miner.etherbase "0x34f9688de6bf5709da5c258b3825cb01c5ae475"
