FROM ethereum/client-go:v1.12.0
WORKDIR /data

COPY genesis.json /genesis.json
COPY init.sh /init.sh
COPY password.txt /data/password.txt

# 確保 keystore 目錄存在
RUN mkdir -p /data/keystore

RUN chmod +x /init.sh
ENTRYPOINT ["/init.sh"]
