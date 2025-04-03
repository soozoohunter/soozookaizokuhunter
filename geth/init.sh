#!/bin/sh
set -e

# 如果沒有 /data/geth/chaindata 則初始化
if [ ! -d "/data/geth/chaindata" ]; then
  geth --datadir /data init /genesis.json
fi

# 假設您要用 <SignerAddr> 做出塊者
# 需將該地址的 keystore JSON 放到 /data/keystore 或 unlock 方式

# 範例：預設先unlock signer
# (可將密碼寫在 password.txt, 再 COPY password.txt /)
# 本示例以 --allow-insecure-unlock + --unlock
# 之後會自動產塊(無需 PoW)
exec geth --datadir /data \
  --http \
  --http.addr 0.0.0.0 \
  --http.port 8545 \
  --http.api "eth,net,web3,personal" \
  --nodiscover \
  --networkid 15 \
  --unlock <SignerAddr> \
  --allow-insecure-unlock \
  --password /data/password.txt \
  --syncmode full \
  --mine
