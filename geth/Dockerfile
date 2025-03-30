# 使用官方最新的 geth (go-ethereum) 映像檔
FROM ethereum/client-go:latest

# 1) 將專案內的 genesis.json 複製到容器內
COPY genesis.json /genesis.json

# 2) 建立資料夾 /data
RUN mkdir -p /data

# 3) 用 RUN 在 Build 階段做「私有鏈初始化」
RUN geth init --datadir /data /genesis.json

# 4) (可選) 預先放一個 keystore JSON 檔到 /data/keystore
RUN mkdir -p /data/keystore
# 以下示範內容為假 keystore，可替換成你的真實值
RUN echo '{"version":3,"id":"some-uuid","address":"110cb167ea55c3467cd82fdef9dd570b7d3f30b8","crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"799bbcce16e7e43972b0ea87c9adf76e"},"ciphertext":"aaaaaa...snip...","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"12345abcd","n":8192,"r":8,"p":1},"mac":"ffff...snip..."},"meta":"DEMO keystore"}' \
  > /data/keystore/UTC--2023-01-01T00-00-00.000000000Z--110cb167ea55c3467cd82fdef9dd570b7d3f30b8

# 5) 開啟 RPC/Peer 連接等端口
EXPOSE 8545
EXPOSE 30303
EXPOSE 30303/udp

# 6) CMD：容器運行時要執行的指令 + 參數
CMD [
  "geth",
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
  "--miner.etherbase=0x110cb167ea55c3467cd82fdef9dd570b7d3f30b8"
]
