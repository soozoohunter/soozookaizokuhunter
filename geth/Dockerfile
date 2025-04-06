# Use official Ethereum Geth image as base
FROM ethereum/client-go:stable

# Create directories and copy configuration files
RUN mkdir -p /geth/keystore
COPY genesis.json /geth/genesis.json
COPY keystore/UTC--2025-04-03T08-00-02.051862034Z--034f9688de6bf5709da5c258b3825cb01c5ae475 /geth/keystore/
COPY init.sh /geth/init.sh

# Add the password file for the keystore
RUN echo "Zack967988" > /geth/password.txt

# Ensure the init script is executable
RUN chmod +x /geth/init.sh

# Set the entrypoint to the init script
ENTRYPOINT ["/geth/init.sh"]
