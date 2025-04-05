FROM ethereum/client-go:v1.10.26

# 設定工作目錄
WORKDIR /geth

# 複製創世區塊配置與帳戶資料到容器中
COPY genesis.json /geth/genesis.json
COPY keystore/ /geth/keystore/
COPY password.txt /geth/password.txt

# 複製並設定初始化腳本
COPY init.sh /geth/init.sh
RUN chmod +x /geth/init.sh

# 開放 HTTP 端口（如您需要透過 HTTP 存取 geth）
EXPOSE 8545

# 進入點：執行初始化腳本，初始化後啟動 geth 節點
ENTRYPOINT ["/geth/init.sh"]