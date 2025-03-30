# soozookaizokuhunter/geth/Dockerfile

FROM ethereum/client-go:latest

# copy genesis.json
COPY genesis.json /genesis.json

# 資料放 /data
RUN mkdir -p /data
RUN geth init --datadir /data /genesis.json

# 範例: 預先放一個 keystore JSON (可替換成你自己的)
RUN mkdir -p /data/keystore
RUN echo '{"version":3,"id":"some-uuid","address":"110cb167ea55c3467cd82fdef9dd570b7d3f30b8","crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"799bbcce16e7e43972b0ea87c9adf76e"},"ciphertext":"...","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"...","n":8192,"r":8,"p":1},"mac":"..."},"meta":"DEMO"}' \
    > /data/keystore/UTC--2023-01-01T00-00-00.000000000Z--110cb167ea55c3467cd82fdef9dd570b7d3f30b8

EXPOSE 8545 30303 30303/udp

CMD ["geth",
     "--datadir", "/data",
     "--networkid", "12345",
     "--http",
     "--http.addr", "0.0.0.0",
     "--http.port", "8545",
     "--http.api", "eth,net,web3,personal",
     "--allow-insecure-unlock",
     "--unlock", "0x110cb167ea55c3467cd82fdef9dd570b7d3f30b8",
     "--password", "/dev/null",
     "--mine",
     "--miner.threads=1",
     "--miner.etherbase=0x110cb167ea55c3467cd82fdef9dd570b7d3f30b8"]
