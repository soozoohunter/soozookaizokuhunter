/**
 * express/utils/chain.js (完整修正版)
 *
 * 【核心修正】:
 * 1. 使用 web3.js，並增加帶有重試機制的非同步初始化函式 `initChainService`，解決啟動時序問題。
 * 2. 使用狀態變數 `isInitialized` 來追蹤服務是否可用。
 * 3. `storeRecord` 函式會先檢查服務是否已初始化，如果沒有，會等待初始化完成，確保操作的可靠性。
 * 4. 提供了更清晰的日誌，方便追蹤區塊鏈服務的連接狀態。
 */
const Web3 = require('web3');

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://suzoo_ganache:8545';
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || '';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 秒

const contractAbi = [
    {
        "inputs": [
            { "internalType": "string", "name": "_fingerprint", "type": "string" },
            { "internalType": "string", "name": "_ipfsHash", "type": "string" }
        ],
        "name": "storeRecord",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

let web3;
let contract;
let account;
let isInitialized = false;
let initializePromise = null;

// 【優化】: 帶有重試機制的非同步初始化函式
async function initChainService() {
    if (!CONTRACT_ADDRESS || !PRIVATE_KEY || !RPC_URL) {
        console.warn('[chain.js] Blockchain environment variables are not fully set. Service will be disabled.');
        return;
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`[chain.js] Attempt ${attempt}/${MAX_RETRIES} to connect to blockchain at ${RPC_URL}...`);
            
            web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL));
            
            // 測試連接
            const chainId = await web3.eth.getChainId();
            console.log(`[chain.js] Connected to network with chainId: ${chainId}`);
            
            contract = new web3.eth.Contract(contractAbi, CONTRACT_ADDRESS);
            account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
            web3.eth.accounts.wallet.add(account); // 將帳戶加入錢包，方便後續操作

            console.log(`[chain.js] Contract loaded at address => ${CONTRACT_ADDRESS}`);
            console.log(`[chain.js] Wallet address => ${account.address}`);
            
            isInitialized = true;
            console.log('[chain.js] Blockchain service successfully initialized.');
            return; // 成功後退出循環

        } catch (err) {
            console.error(`[chain.js] Initialization attempt ${attempt} failed:`, err.message);
            if (attempt === MAX_RETRIES) {
                console.error('[chain.js] FATAL: All attempts to initialize blockchain service failed.');
                return;
            }
            await new Promise(res => setTimeout(res, RETRY_DELAY));
        }
    }
}

async function storeRecord(fingerprint, ipfsHash = '') {
    // 如果正在初始化，等待完成
    if (initializePromise) {
        await initializePromise;
    }
    
    if (!isInitialized) {
        console.warn('[chain.js] Blockchain service is not initialized, returning FAKE Tx');
        return { transactionHash: '0xCHAIN_SERVICE_DISABLED' };
    }

    try {
        console.log(`[chain.js] Storing record on-chain: fingerprint=${fingerprint.slice(0,10)}..., ipfsHash=${ipfsHash.slice(0,10)}...`);
        const data = contract.methods.storeRecord(fingerprint, ipfsHash).encodeABI();

        const gasPrice = await web3.eth.getGasPrice();
        const gasEstimate = await web3.eth.estimateGas({
            from: account.address,
            to: CONTRACT_ADDRESS,
            data: data
        });

        const tx = {
            from: account.address,
            to: CONTRACT_ADDRESS,
            data,
            gas: gasEstimate,
            gasPrice: gasPrice
        };

        console.log('[chain.js] Sending transaction...');
        const receipt = await web3.eth.sendTransaction(tx);
        console.log('[chain.js] Transaction successful with hash:', receipt.transactionHash);
        return { transactionHash: receipt.transactionHash };
    } catch (err) {
        console.error('[chain.js] Error storing record on chain:', err.message);
        // 返回 null 表示失敗，讓呼叫者知道
        return null;
    }
}

// 立即開始初始化過程，但不阻塞主線程
initializePromise = initChainService();

module.exports = { storeRecord };
