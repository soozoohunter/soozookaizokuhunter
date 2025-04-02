# geth/Dockerfile
FROM ethereum/client-go:v1.12.0
WORKDIR /data
EXPOSE 8545
CMD ["--http", "--http.addr", "0.0.0.0", "--http.port", "8545", "--http.api", "eth,net,web3,personal", "--nodiscover", "--networkid", "15", "--syncmode", "full", "--mine", "--miner.threads", "1", "--miner.etherbase", "0x0000000000000000000000000000000000000000"]
