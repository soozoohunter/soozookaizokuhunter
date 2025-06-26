// express/utils/chain.js (Enhanced Logging Version)
const Web3 = require('web3'); // 使用 web3.js v1.x 的正確引入方式
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
            web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

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

    logger.info(`[Chain] Preparing to store record on-chain...`, {
        fingerprint: `${fingerprint.substring(0, 12)}...`,
        ipfsHash: ipfsHash
    });

    try {
        const fromAddress = account.address;
        const gasPrice = await web3.eth.getGasPrice();
        
        logger.info(`[Chain] Estimating gas for storeRecord from address: ${fromAddress}`);
        
        // 預估 Gas 用量
        const estimatedGas = await contract.methods.storeRecord(fingerprint, ipfsHash).estimateGas({ from: fromAddress });
        logger.info(`[Chain] Gas estimated: ${estimatedGas}. Gas price: ${web3.utils.fromWei(gasPrice, 'gwei')} Gwei.`);

        // 【新增】為預估的 gas 增加 20% 的緩衝，以提高在測試網路上的成功率
        const gasLimit = Math.ceil(estimatedGas * 1.2);
        logger.info(`[Chain] Sending transaction with gas limit: ${gasLimit}`);

        // 發送交易
        const receipt = await contract.methods.storeRecord(fingerprint, ipfsHash).send({
            from: fromAddress,
            gas: gasLimit, // 使用帶有緩衝的 gas 上限
            gasPrice: gasPrice
        });

        logger.info(`[Chain] Transaction successful! TxHash: ${receipt.transactionHash}`);
        return receipt;

    } catch (error) {
        // 【新增】印出更詳細的錯誤資訊，幫助診斷問題
        logger.error(`[Chain] Blockchain transaction failed.`, {
            errorMessage: error.message,
            // Ganache 或其他節點常常會將詳細資訊放在內部錯誤中
            innerError: error.innerError ? error.innerError.message : 'N/A',
            receipt: error.receipt, // 交易收據可能包含 reverts 的原因
            stack: error.stack
        });
        
        // 重新拋出錯誤，確保上層的 try/catch 區塊能捕捉到
        throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
}

module.exports = {
    initializeBlockchainService,
    storeRecord,
    isReady: () => isInitialized,
};
