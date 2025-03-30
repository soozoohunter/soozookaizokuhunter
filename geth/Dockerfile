# 1) 使用明確版本而非 latest，避免不小心拉到 PoS 合併後版本
FROM ethereum/client-go:v1.10.26

# 2) 官方鏡像會以 non-root 用戶 `ethereum` 執行 
#    先切回 root 方便我們建立資料夾並調整權限
USER root

# 建立資料夾, 並確保後面能寫入
RUN mkdir -p /home/ethereum/data
RUN chown -R 1000:1000 /home/ethereum

# 切換回鏡像預設用戶(UID=1000,名為 ethereum)
USER 1000

# 3) 設定工作目錄為 /home/ethereum
WORKDIR /home/ethereum

# 4) 複製 genesis.json 到工作目錄
COPY genesis.json ./genesis.json

# 5) 建立密碼檔(用於解鎖帳戶)
RUN echo "MyPassw0rd" > .pwd

# 6) 建立私鑰檔(純示範: 64字16進位), 需與 genesis.json 同一地址對應
RUN echo "111122223333444455556666777788889999aaaabbbbccccddddeeeeffff0000" > mypriv.key

# 7) 匯入私鑰 => 產生 keystore (需輸入 .pwd)
RUN geth account import /home/ethereum/mypriv.key \
      --datadir /home/ethereum/data \
      --password /home/ethereum/.pwd

# 8) 初始化區塊鏈
RUN geth init genesis.json --datadir /home/ethereum/data

# 9) 開放連接埠
EXPOSE 8545 30303 30303/udp

# 10) 最終啟動指令
CMD [
  "geth",
  "--datadir", "/home/ethereum/data",
  "--networkid", "12345",
  "--http",
  "--http.addr", "0.0.0.0",
  "--http.port", "8545",
  "--http.api", "eth,net,web3,miner,debug",
  "--unlock", "0x110cb167ea55c3467cd82fdef9dd570b7d3f30b8",
  "--password", "/home/ethereum/.pwd",
  "--allow-insecure-unlock",
  "--mine",
  "--miner.threads=1",
  "--miner.etherbase", "0x110cb167ea55c3467cd82fdef9dd570b7d3f30b8",
  "--nodiscover"
]
