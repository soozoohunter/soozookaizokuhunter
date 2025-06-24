/**
 * express/utils/chain.js (最終健壯性修正版)
 *
 * 【核心修正】:
 * 1.  除了原有的 storeRecord 外，額外導出 `initChainService` 和 `isChainInitialized`。
 * 2.  移除了檔案底部的自動執行，將初始化的控制權完全交還給 server.js。
 * 3.  在初始化完全失敗時，會向上拋出錯誤，以中斷伺服器啟動流程，防止帶病運行。
 */
const Web3 = require('web3');

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://suzoo_ganache:8545';
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || '';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

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

async function initChainService() {
    if (isInitialized) return;

    if (!CONTRACT_ADDRESS || !PRIVATE_KEY || !RPC_URL) {
        console.warn('[chain.js] 區塊鏈環境變數未完全設定，服務將被停用。');
        isInitialized = false;
        return;
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`[chain.js] 第 ${attempt}/${MAX_RETRIES} 次嘗試連接區塊鏈節點於 ${RPC_URL}...`);
            
            web3 = new Web3(RPC_URL);
            
            await web3.eth.getChainId(); // 作為健康檢查
            
            contract = new web3.eth.Contract(contractAbi, CONTRACT_ADDRESS);
            account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
            web3.eth.accounts.wallet.add(account);

            console.log(`[chain.js] 區塊鏈服務成功初始化。錢包地址: ${account.address}`);
            isInitialized = true;
            return;

        } catch (err) {
            console.error(`[chain.js] 初始化嘗試第 ${attempt} 次失敗:`, err.message);
            if (attempt === MAX_RETRIES) {
                console.error('[chain.js] 致命錯誤：所有初始化區塊鏈服務的嘗試均告失敗。');
                // 【關鍵】向上拋出錯誤，讓主啟動流程知道失敗
                throw new Error("Blockchain service could not be initialized.");
            }
            await new Promise(res => setTimeout(res, RETRY_DELAY));
        }
    }
}

async function storeRecord(fingerprint, ipfsHash = '') {
    if (!isInitialized) {
        console.warn('[chain.js] 區塊鏈服務未初始化，返回模擬的交易 Hash。');
        return { transactionHash: '0xCHAIN_SERVICE_DISABLED_OR_FAILED_TO_INIT' };
    }

    try {
        console.log(`[chain.js] 準備將紀錄上鏈: fingerprint=${fingerprint.slice(0,10)}...`);
        const data = contract.methods.storeRecord(fingerprint, ipfsHash).encodeABI();
        const gasPrice = await web3.eth.getGasPrice();
        const gasEstimate = await contract.methods.storeRecord(fingerprint, ipfsHash).estimateGas({ from: account.address });

        const tx = { from: account.address, to: CONTRACT_ADDRESS, data, gas: gasEstimate, gasPrice };

        console.log('[chain.js] 正在發送交易...');
        const receipt = await web3.eth.sendTransaction(tx);
        console.log('[chain.js] 交易成功，交易 Hash:', receipt.transactionHash);
        return { transactionHash: receipt.transactionHash };

    } catch (err) {
        console.error('[chain.js] 將紀錄儲存至鏈上時發生錯誤:', err.message);
        return null;
    }
}

module.exports = { 
    initChainService,
    storeRecord,
    isChainInitialized: () => isInitialized 
};
