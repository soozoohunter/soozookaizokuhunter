FROM ethereum/client-go:latest

WORKDIR /root

# 1. 複製 genesis.json
COPY genesis.json /root/genesis.json

RUN mkdir -p /root/.ethereum
RUN geth init /root/genesis.json --datadir /root/.ethereum

# 2. 建立範例 keystore (示範硬碼)
RUN echo '{"version":3,"id":"some-uuid","address":"110cb167ea55c3467cd82fdef9dd570b7d3f30b8","crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"799bbcce16e7e43972b0ea87c9adf76e"},"ciphertext":"b930...","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"...","n":8192,"r":8,"p":1},"mac":"..."},"meta":"DEMO"}' \
 > /root/.ethereum/keystore/UTC--2025-03-29T00-00-00.000000000Z--110cb167ea55c3467cd82fdef9dd570b7d3f30b8

# 3. 新增帳號 & 指定密碼(123456) - 預設測試
RUN echo -e "123456\n123456\n" | geth account new --password /dev/stdin --datadir /root/.ethereum

EXPOSE 30303 30303/udp 8545

# 4. ethereum/client-go:latest 已有 ENTRYPOINT ["geth"]
#    所以 CMD 不需要 "geth" -> 只要參數即可
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
