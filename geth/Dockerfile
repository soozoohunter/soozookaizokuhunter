FROM ethereum/client-go:latest

WORKDIR /root

COPY genesis.json /root/genesis.json
RUN mkdir -p /root/.ethereum
RUN geth init /root/genesis.json --datadir /root/.ethereum

EXPOSE 30303 30303/udp 8545
CMD ["geth",
     "--datadir","/root/.ethereum",
     "--networkid","12345",
     "--http","--http.addr","0.0.0.0","--http.port","8545",
     "--http.api","eth,net,web3,personal",
     "--allow-insecure-unlock",
     "--dev",
     "--unlock","0x110cb167ea55c3467cd82fdef9dd570b7d3f30b8",
     "--password","/dev/null"]
