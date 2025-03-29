# 確保第一行是 FROM 指令
FROM ethereum/client-go:latest

WORKDIR /root
COPY genesis.json .

RUN mkdir -p /root/.ethereum && \
    geth init --datadir /root/.ethereum genesis.json

CMD ["geth", "--datadir", "/root/.ethereum", "--networkid", "12345", "--http", "--http.addr", "0.0.0.0", "--http.port", "8545", "--http.api", "eth,net,web3,personal", "--allow-insecure-unlock", "--dev"]