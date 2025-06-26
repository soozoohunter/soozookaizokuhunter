// express/utils/chain.js (Final Version-Compatible Fix)
const Web3 = require('web3'); // 【關鍵修正】使用 web3.js v1.x 的正確引入方式
const { getABI } = require('./contract');
const logger = require('./logger');

// --- 區塊鏈設定 ---
const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
const contractAddress = process.env.CONTRACT_ADDRESS;

// --- 全域變數 ---
let web3;
let contract;
let account;
let isInitialized = false;

/**
 * 初始化區塊鏈服務。
 */
async function initializeBlockchainService(retries = 5, delay = 5000) {
    if (isInitialized) {
        logger.info('[Chain] Blockchain service already initialized.');
        return;
    }

    if (!privateKey || !contractAddress || !rpcUrl) {
        logger.error('[Chain] Blockchain environment variables (RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS) are not fully configured.');
        throw new Error("Blockchain service cannot be initialized due to missing configuration.");
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            logger.info(`[Chain] Attempt ${attempt}/${retries} to connect to blockchain node at ${rpcUrl}...`);
            // 【關鍵修正】使用 web3.js v1.x 的正確初始化方式
            web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

            // 進行健康檢查
            if (await web3.eth.net.isListening()) {
                account = web3.eth.accounts.privateKeyToAccount(privateKey);
                web3.eth.accounts.wallet.add(account);
                web3.eth.defaultAccount = account.address;

                const abi = getABI('Copyright');
                if (!abi) {
                    throw new Error("Failed to get ABI for 'Copyright' contract.");
                }
                contract = new web3.eth.Contract(abi, contractAddress);

                isInitialized = true;
                logger.info(`[Chain] Blockchain service initialized successfully. Wallet address: ${account.address}`);
                return;
            }
        } catch (error) {
            logger.error(`[Chain] Connection attempt ${attempt} failed:`, { message: error.message, stack: error.stack });
            if (attempt === retries) {
                logger.error('[Chain] All attempts to connect to the blockchain node have failed. Service unavailable.');
                throw new Error("Could not initialize blockchain service after maximum retries.");
            }
            await new Promise(res => setTimeout(res, delay));
        }
    }
}

/**
 * 將紀錄儲存到區塊鏈上。
 */
async function storeRecord(fingerprint, ipfsHash) {
    if (!isInitialized) {
        logger.error('[Chain] Cannot store record because blockchain service is not initialized.');
        throw new Error('Blockchain service is not ready. Cannot perform on-chain storage.');
    }

    try {
        logger.info(`[Chain] Preparing to store record on-chain: fingerprint=${fingerprint.substring(0, 12)}...`);

        const gas = await contract.methods.storeRecord(fingerprint, ipfsHash).estimateGas({ from: account.address });
        const gasPrice = await web3.eth.getGasPrice();

        logger.info(`[Chain] Sending transaction... (Gas estimate: ${gas}, Gas price: ${web3.utils.fromWei(gasPrice, 'gwei')} Gwei)`);

        const receipt = await contract.methods.storeRecord(fingerprint, ipfsHash).send({
            from: account.address,
            gas: gas,
            gasPrice: gasPrice
        });

        logger.info(`[Chain] Transaction successful! TxHash: ${receipt.transactionHash}`);
        return receipt;

    } catch (error) {
        logger.error(`[Chain] Blockchain transaction failed:`, { message: error.message });
        throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
}

module.exports = {
    initializeBlockchainService,
    storeRecord,
    isReady: () => isInitialized,
};
