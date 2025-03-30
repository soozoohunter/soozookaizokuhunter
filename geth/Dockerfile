# Dockerfile: geth/Dockerfile

# 使用官方 Ethereum Geth 映像 (內含 ENTRYPOINT ["geth"])
FROM ethereum/client-go:latest

WORKDIR /root

# 1. 複製 genesis.json
COPY genesis.json /root/genesis.json

# 2. 初始化資料目錄
RUN mkdir -p /root/.ethereum
RUN geth init /root/genesis.json --datadir /root/.ethereum

# 3. 建立範例 keystore (示範硬碼)
#   address: 0x110cb167ea55c3467cd82fdef9dd570b7d3f30b8
RUN echo '{"version":3,"id":"some-uuid","address":"110cb167ea55c3467cd82fdef9dd570b7d3f30b8","crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"799bbcce16e7e43972b0ea87c9adf76e"},"ciphertext":"b930...","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"...","n":8192,"r":8,"p":1},"mac":"..."},"meta":"DEMO"}' \
     > /root/.ethereum/keystore/UTC--2025-03-29T00-00-00.000000000Z--110cb167ea55c3467cd82fdef9dd570b7d3f30b8

# 4. 新增帳號 & 指定密碼(123456)
#   注意: 這裡是示範 -e "123456\n123456\n" (兩次輸入)
RUN echo -e "123456\n123456\n" | geth account new --password /dev/stdin --datadir /root/.ethereum

# 開放必要埠
EXPOSE 30303 30303/udp 8545

# 5. 由於 base image 內部有 ENTRYPOINT ["geth"]
#    我們在這裡只需 CMD [ "參數1", "參數2", ...]
CMD [
  "--datadir", "/root/.ethereum",
  "--networkid", "12345",
  "--http",
  "--http.addr", "0.0.0.0",
  "--http.port", "8545",
  "--http.api", "eth,net,web3,personal",
  "--allow-insecure-unlock",
  "--dev",
  "--unlock", "0x110cb167ea55c3467cd82fdef9dd570b7d3f30b8",
  "--password", "/dev/null"
]
