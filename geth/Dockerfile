FROM ethereum/client-go:stable

COPY genesis.json /genesis.json

# 若要初始化私有鏈
# docker build 時可做 geth init
RUN geth init /genesis.json

EXPOSE 8545
EXPOSE 30303
EXPOSE 30303/udp

CMD ["geth", "--networkid", "9955", "--http", "--http.addr", "0.0.0.0", "--http.api", "eth,net,web3,personal", "--syncmode=full", "--allow-insecure-unlock", "--mine", "--miner.threads=1", "--http.corsdomain", "*", "--verbosity=3"]
