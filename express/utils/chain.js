// express/utils/chain.js (Final Robust Version)
const { Web3 } = require('web3');
const { getABI } = require('./contract'); // 假設 contract helper 存在
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
 * 包含重試機制，並在最終失敗時拋出致命錯誤以中斷伺服器啟動。
 * @param {number} retries - 最大重試次數。
 * @param {number} delay - 每次重試之間的延遲（毫秒）。
 */
async function initializeBlockchainService(retries = 5, delay = 5000) {
    if (isInitialized) {
        logger.info('[Chain] Blockchain service already initialized.');
        return;
    }

    if (!privateKey || !contractAddress || !rpcUrl) {
        logger.error('[Chain] Blockchain environment variables (RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS) are not fully configured.');
        isInitialized = false;
        // 拋出致命錯誤，讓 startServer 捕捉並中斷啟動
        throw new Error("Blockchain service cannot be initialized due to missing configuration.");
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            logger.info(`[Chain] Attempt ${attempt}/${retries} to connect to blockchain node at ${rpcUrl}...`);
            web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
            
            // 進行健康檢查，確認節點是否在監聽
            if (await web3.eth.net.isListening()) {
                account = web3.eth.accounts.privateKeyToAccount(privateKey);
                web3.eth.accounts.wallet.add(account);
                web3.eth.defaultAccount = account.address;
                
                const abi = getABI('Copyright'); // 從 helper 獲取 ABI
                contract = new web3.eth.Contract(abi, contractAddress);
                
                isInitialized = true;
                logger.info(`[Chain] Blockchain service initialized successfully. Wallet address: ${account.address}`);
                return; // 初始化成功，退出循環
            }
        } catch (error) {
            logger.error(`[Chain] Connection attempt ${attempt} failed: ${error.message}`);
            if (attempt === retries) {
                logger.error('[Chain] All attempts to connect to the blockchain node have failed. Service unavailable.');
                isInitialized = false;
                throw new Error("Could not initialize blockchain service after maximum retries.");
            }
            // 等待後重試
            await new Promise(res => setTimeout(res, delay));
        }
    }
}

/**
 * 將紀錄（指紋和 IPFS Hash）儲存到區塊鏈上。
 * @param {string} fingerprint - 檔案的唯一 SHA256 指紋。
 * @param {string} ipfsHash - 檔案在 IPFS 上的 CID。
 * @returns {Promise<object>} - 返回以太坊交易收據 (receipt)。
 */
async function storeRecord(fingerprint, ipfsHash) {
    if (!isInitialized) {
        logger.error('[Chain] Cannot store record because blockchain service is not initialized.');
        throw new Error('Blockchain service is not ready. Cannot perform on-chain storage.');
    }

    try {
        logger.info(`[Chain] Preparing to store record on-chain: fingerprint=${fingerprint.substring(0, 12)}...`);
        
        // 估算 Gas
        const gas = await contract.methods.storeRecord(fingerprint, ipfsHash).estimateGas({ from: account.address });
        const gasPrice = await web3.eth.getGasPrice();

        logger.info(`[Chain] Sending transaction... (Gas estimate: ${gas}, Gas price: ${web3.utils.fromWei(gasPrice, 'gwei')} Gwei)`);

        // 發送交易
        const receipt = await contract.methods.storeRecord(fingerprint, ipfsHash).send({
            from: account.address,
            gas: gas, // 使用估算的 gas
            gasPrice: gasPrice
        });
        
        logger.info(`[Chain] Transaction successful! TxHash: ${receipt.transactionHash}`);
        return receipt;

    } catch (error) {
        logger.error(`[Chain] Blockchain transaction failed: ${error.message}`);
        // 向上拋出錯誤，讓調用者（如 protect.js）可以捕捉並處理
        throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
}

module.exports = {
    initializeBlockchainService,
    storeRecord,
    isReady: () => isInitialized,
};
