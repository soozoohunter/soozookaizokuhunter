# geth/Dockerfile
FROM ethereum/client-go:v1.12.0
WORKDIR /data

COPY init.sh /init.sh
RUN chmod +x /init.sh

# genesis.json 由 volumes 掛載
ENTRYPOINT ["/init.sh"]
