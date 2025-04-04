FROM ethereum/client-go:v1.12.0
WORKDIR /data

# 請確保以下檔案都已放在 geth/ 資料夾內
COPY genesis.json /genesis.json
COPY keystore /data/keystore
COPY password.txt /data/password.txt
COPY init.sh /init.sh
RUN chmod +x /init.sh

ENTRYPOINT ["/init.sh"]
