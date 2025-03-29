FROM ethereum/client-go:latest

WORKDIR /root
COPY genesis.json /root/genesis.json

RUN mkdir -p /root/.ethereum
RUN geth init /root/genesis.json --datadir /root/.ethereum

# 預先建立一個 "範例" keystore 檔
# *** 教學示範：將 0x11112222... 私鑰轉成 keystore JSON ***
# 這裡簡化示例: echo "keystore json" > keystore檔
RUN echo '{"version":3,"id":"some-uuid","address":"110cb167ea55c3467cd82fdef9dd570b7d3f30b8","crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"799bbcce16e7e43972b0ea87c9adf76e"},"ciphertext":"b930...","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"...","n":8192,"r":8,"p":1},"mac":"..."},"meta":"DEMO"}' \
     > /root/.ethereum/keystore/UTC--2023-06-01T00-00-00.000000000Z--110cb167ea55c3467cd82fdef9dd570b7d3f30b8

# 預先unlock
RUN echo -e "123456\n123456\n" | geth account new --password /dev/stdin --datadir /root/.ethereum

EXPOSE 30303 30303/udp 8545
CMD ["geth",
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
