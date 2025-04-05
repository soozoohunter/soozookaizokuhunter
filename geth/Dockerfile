FROM ethereum/client-go:v1.10.26

# 工作目錄準備
WORKDIR /geth

# 複製創世區塊配置和帳戶資料
COPY genesis.json /geth/genesis.json
COPY keystore/ /geth/keystore/
COPY password.txt /geth/password.txt

# 複製並設定初始化腳本
COPY init.sh /geth/init.sh
RUN chmod +x /geth/init.sh

# 進入點執行 Geth 初始化並啟動節點
ENTRYPOINT ["/geth/init.sh"]
