# 使用官方 Geth 鏡像
FROM ethereum/client-go:latest

# 將創世文件複製到容器中
COPY genesis.json /genesis.json

# 指定默認數據目錄 (與 docker-compose 的 volume 掛載路徑一致)
VOLUME /data

# 直接使用默認啟動命令 (具體參數在 docker-compose.yml 的 entrypoint 中動態組合)
CMD ["--http", "--http.addr", "0.0.0.0", "--http.api", "eth,net,web3,personal", "--allow-insecure-unlock", "--dev"]
