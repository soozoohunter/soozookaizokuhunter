FROM ethereum/client-go:1.13.5

RUN addgroup -g 1000 gethuser && \
    adduser -D -u 1000 -G gethuser gethuser && \
    mkdir -p /geth/data/keystore

WORKDIR /geth

COPY genesis.json /geth/genesis.json
COPY keystore/ /geth/keystore/
COPY password.txt /geth/password.txt
COPY init.sh /geth/init.sh

RUN chown -R gethuser:gethuser /geth && \
    chmod 0400 /geth/genesis.json && \
    chmod 0500 /geth/init.sh && \
    chmod 0400 /geth/password.txt && \
    chmod -R 0700 /geth/keystore  # 遞歸設置權限

USER gethuser

EXPOSE 8545 30303 8546

ENTRYPOINT ["/bin/sh", "/geth/init.sh"]
