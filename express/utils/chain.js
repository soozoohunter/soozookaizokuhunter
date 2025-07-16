// express/utils/chain.js (Final Corrected Version)
const Web3 = require('web3');
const { getABI } = require('./contract');
const logger = require('./logger');

// Retry configuration for blockchain connection
const MAX_RETRIES = 15;  // Increased from 5
const RETRY_DELAY = 5000; // 5 seconds

const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
const contractAddress = process.env.CONTRACT_ADDRESS;

let web3;
let contract;
let account;
let isInitialized = false;

async function initializeBlockchainService(retries = MAX_RETRIES, delay = RETRY_DELAY) {
    if (isInitialized) return;

    if (!privateKey || !contractAddress || !rpcUrl) {
        throw new Error("Blockchain service cannot be initialized due to missing configuration.");
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            logger.info(`[Chain] Attempt ${attempt}/${retries} to connect to blockchain node at ${rpcUrl}...`);
            web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

            if (await web3.eth.net.isListening()) {
                account = web3.eth.accounts.privateKeyToAccount(privateKey);
                web3.eth.accounts.wallet.add(account);
                web3.eth.defaultAccount = account.address;

                const abi = getABI('Copyright');
                if (!abi) throw new Error("Failed to get ABI for 'Copyright' contract.");
                
                contract = new web3.eth.Contract(abi, contractAddress);

                // Ensure the account has sufficient balance on the dev chain
                const minBalance = web3.utils.toWei('1', 'ether');
                const currentBalance = await web3.eth.getBalance(account.address);
                if (web3.utils.toBN(currentBalance).lt(web3.utils.toBN(minBalance))) {
                    const [funder] = await web3.eth.getAccounts();
                    if (funder && funder.toLowerCase() !== account.address.toLowerCase()) {
                        logger.info(`[Chain] Funding wallet ${account.address} from ${funder}...`);
                        await web3.eth.sendTransaction({
                            from: funder,
                            to: account.address,
                            value: minBalance,
                        });
                        logger.info('[Chain] Wallet funded successfully.');
                    }
                }

                isInitialized = true;
                logger.info(`[Chain] Blockchain service initialized successfully. Wallet address: ${account.address}`);
                return;
            }
        } catch (error) {
            logger.error(`[Chain] Connection attempt ${attempt} failed:`, { message: error.message });
            if (attempt === retries) {
                throw new Error("Could not initialize blockchain service after maximum retries.");
            }
            await new Promise(res => setTimeout(res, delay));
        }
    }
}

async function storeRecord(fingerprint, ipfsHash) {
    if (!isInitialized) {
        throw new Error('Blockchain service is not ready. Cannot perform on-chain storage.');
    }

    logger.info(`[Chain] Preparing to store record on-chain...`, {
        fingerprint: `${fingerprint.substring(0, 12)}...`,
        ipfsHash: ipfsHash
    });

    try {
        const fromAddress = account.address;
        logger.info(`[Chain] Sending transaction from address: ${fromAddress}`);

        // 【關鍵修正】明確地獲取 Gas Price 和估算 Gas Limit
        logger.info(`[Chain] Fetching gas price...`);
        const gasPrice = await web3.eth.getGasPrice();
        logger.info(`[Chain] Gas price fetched: ${gasPrice}`);

        logger.info(`[Chain] Estimating gas for storeRecord...`);
        const estimatedGas = await contract.methods.storeRecord(fingerprint, ipfsHash).estimateGas({
            from: fromAddress,
        });
        logger.info(`[Chain] Gas estimated successfully: ${estimatedGas}`);

        // 發送交易，並明確提供所有參數
        const receipt = await contract.methods.storeRecord(fingerprint, ipfsHash).send({
            from: fromAddress,
            gas: estimatedGas,
            gasPrice: gasPrice,
        });

        logger.info(`[Chain] Transaction successful! TxHash: ${receipt.transactionHash}`);
        return receipt;

    } catch (error) {
        logger.error(`[Chain] Blockchain transaction failed.`, {
            errorMessage: error.message,
            stack: error.stack
        });
        throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
}

module.exports = {
    initializeBlockchainService,
    storeRecord,
    isReady: () => isInitialized,
};
