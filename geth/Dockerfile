FROM ethereum/client-go:v1.11.6
WORKDIR /data

# 複製 genesis.json、啟動腳本及密碼檔
COPY genesis.json /genesis.json
COPY init.sh /init.sh
COPY password.txt /data/password.txt

# 設定啟動腳本可執行
RUN chmod +x /init.sh

ENTRYPOINT ["/init.sh"]
