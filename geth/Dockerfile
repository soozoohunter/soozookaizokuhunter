# geth/Dockerfile
FROM ethereum/client-go:v1.11.6
WORKDIR /data

# 複製必要檔案
COPY genesis.json /genesis.json
COPY init.sh /init.sh
COPY password.txt /data/password.txt

RUN chmod +x /init.sh

ENTRYPOINT ["/init.sh"]
