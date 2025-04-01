FROM ethereum/client-go:stable

COPY genesis.json /genesis.json

# 若有需要初始化可加:
# RUN geth init /genesis.json

# 露出埠口
EXPOSE 8545 30303 30303/udp

CMD ["geth", "--http", "--http.addr", "0.0.0.0", "--http.port", "8545", "--http.api", "eth,web3,personal,net", "--networkid", "9999", "--allow-insecure-unlock"]
