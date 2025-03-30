FROM ethereum/client-go:latest

WORKDIR /root

# 1. 複製 genesis.json
COPY genesis.json /root/genesis.json

# 2. 初始化資料目錄
RUN mkdir -p /root/.ethereum
RUN geth init /root/genesis.json --datadir /root/.ethereum

# 3. 建立範例 keystore (將私鑰轉成 JSON), 這邊是示範硬碼
RUN echo '{"version":3,"id":"some-uuid","address":"110cb167ea55c3467cd82fdef9dd570b7d3f30b8","crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"799bbcce16e7e43972b0ea87c9adf76e"},"ciphertext":"b930...","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"...","n":8192,"r":8,"p":1},"mac":"..."},"meta":"DEMO"}' \
     > /root/.ethereum/keystore/UTC--2025-03-29T00-00-00.000000000Z--110cb167ea55c3467cd82fdef9dd570b7d3f30b8

# 4. 新增帳號 & 指定密碼(測試用 123456)
RUN echo -e "123456\n123456\n" | geth account new --password /dev/stdin --datadir /root/.ethereum

# 開放必要埠
EXPOSE 30303 30303/udp 8545

# 5. 注意：ethereum/client-go:latest 已有 ENTRYPOINT ["geth"] 
#    所以這裡「不需要」再寫 "geth" ，只需寫參數陣列
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
