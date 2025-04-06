#!/bin/sh
# Data directory for the Ethereum node
DATADIR="/geth/data"

# Ensure keystore directory exists, and import the key if not already present
if [ ! -d "$DATADIR/keystore" ]; then
  mkdir -p "$DATADIR/keystore"
fi

# If no account key is found in the data volume, copy the provided keyfile
if [ -z "$(ls -A "$DATADIR/keystore")" ]; then
  echo "Keystore is empty. Importing account key..."
  cp /geth/keystore/* "$DATADIR/keystore/"
fi

# Initialize the geth datadir with the genesis block if not already done
if [ ! -d "$DATADIR/geth/chaindata" ]; then
  echo "Initializing genesis block..."
  geth init /geth/genesis.json --datadir "$DATADIR"
fi

# Start the Ethereum node with the specified validator account unlocked and mining enabled
echo "Starting geth node..."
exec geth --datadir "$DATADIR" \
  --networkid 2025 \
  --unlock "0x034f9688dE6Bf5709dA5C258b3825Cb01C5ae475" --password /geth/password.txt \
  --mine --allow-insecure-unlock \
  --http --http.addr 0.0.0.0 --http.port 8545 --http.api eth,net,web3,clique \
  --ws --ws.addr 0.0.0.0 --ws.port 8546 --ws.api eth,net,web3,clique \
  --ipcdisable --verbosity 3
