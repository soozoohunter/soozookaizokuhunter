// express/utils/chain.js (Final Simplified Version)
const Web3 = require('web3');
const { getABI } = require('./contract');
const logger = require('./logger');

const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
const contractAddress = process.env.CONTRACT_ADDRESS;

let web3;
let contract;
let account;
let isInitialized = false;

async function initializeBlockchainService(retries = 5, delay = 5000) {
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

        // 【關鍵修正】簡化交易發送邏輯
        // 不再手動估算 Gas 和 Gas Price，讓 web3.js 和 Ganache 自動處理。
        // Ganache 作為測試節點，通常能很好地處理這種自動設定。
        const receipt = await contract.methods.storeRecord(fingerprint, ipfsHash).send({
            from: fromAddress,
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
