FROM ethereum/client-go:v1.13.2

WORKDIR /geth
COPY genesis.json /geth/genesis.json
COPY keystore/ /geth/keystore/
COPY password.txt /geth/password.txt
COPY init.sh /geth/init.sh
RUN chmod +x /geth/init.sh

EXPOSE 8545 30303
ENTRYPOINT ["/geth/init.sh"]
