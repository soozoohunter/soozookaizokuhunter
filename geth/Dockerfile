FROM ethereum/client-go:v1.12.0
WORKDIR /data

COPY init.sh /init.sh
COPY genesis.json /genesis.json

# 複製 keystore/ 資料夾 (裡面放2個 keystore檔)
COPY keystore /data/keystore
COPY password.txt /data/password.txt

RUN chmod +x /init.sh

ENTRYPOINT ["/init.sh"]
