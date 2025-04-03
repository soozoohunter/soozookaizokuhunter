FROM ethereum/client-go:v1.12.0
WORKDIR /data

COPY init.sh /init.sh
COPY genesis.json /genesis.json
RUN chmod +x /init.sh

ENTRYPOINT ["/init.sh"]
