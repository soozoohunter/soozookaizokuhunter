/**
 * express/utils/chain.js (最終健壯性修正版)
 *
 * 【核心修正】:
 * 1.  [錯誤修復] 修改 Web3 初始化方式為 `new Web3(RPC_URL)`，這是更現代且向下相容的語法，
 * 從根本上解決了因 `Web3.providers` 未定義而導致的 `TypeError` 啟動錯誤。
 * 2.  [健壯性提升] 保留並優化了帶有重試機制的非同步初始化函式 `initChainService`，確保在 Docker
 * 環境中，即使 Ganache 服務較晚啟動，也能穩定連接。
 * 3.  [狀態管理] 使用 `isInitialized` 和 `initializePromise` 確保所有外部呼叫 (如 storeRecord)
 * 都會安全地等待初始化完成後再執行。
 * 4.  [日誌優化] 提供了更清晰的日誌輸出，方便追蹤與排錯。
 */
const Web3 = require('web3');

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://suzoo_ganache:8545';
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || '';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 秒

// 您的合約 ABI 保持不變
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
        console.warn('[chain.js] 區塊鏈環境變數未完全設定，服務將被停用。');
        isInitialized = false;
        return;
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`[chain.js] 第 ${attempt}/${MAX_RETRIES} 次嘗試連接區塊鏈節點於 ${RPC_URL}...`);
            
            // ★★★★★ 【核心修正】 ★★★★★
            // 使用更現代且向下相容的初始化方式，直接傳入 RPC URL。
            // 這可以完全避免 `Cannot read properties of undefined (reading 'providers')` 錯誤。
            web3 = new Web3(RPC_URL);
            
            // 進行一個簡單的健康檢查，確保節點真正可用
            const chainId = await web3.eth.getChainId();
            console.log(`[chain.js] 已連接到網路，Chain ID: ${chainId}`);
            
            contract = new web3.eth.Contract(contractAbi, CONTRACT_ADDRESS);
            account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
            web3.eth.accounts.wallet.add(account);

            console.log(`[chain.js] 智慧合約已載入，地址 => ${CONTRACT_ADDRESS}`);
            console.log(`[chain.js] 操作錢包地址 => ${account.address}`);
            
            isInitialized = true;
            console.log('[chain.js] 區塊鏈服務成功初始化。');
            return; // 成功後退出循環

        } catch (err) {
            console.error(`[chain.js] 初始化嘗試第 ${attempt} 次失敗:`, err.message);
            if (attempt === MAX_RETRIES) {
                console.error('[chain.js] 致命錯誤：所有初始化區塊鏈服務的嘗試均告失敗。應用程式可能無法執行上鏈操作。');
                isInitialized = false; // 確保狀態為未初始化
                return;
            }
            await new Promise(res => setTimeout(res, RETRY_DELAY));
        }
    }
}

async function storeRecord(fingerprint, ipfsHash = '') {
    // 如果正在初始化，等待完成。這是確保執行安全性的關鍵。
    if (initializePromise) {
        await initializePromise;
    }
    
    if (!isInitialized) {
        console.warn('[chain.js] 區塊鏈服務未初始化，返回模擬的交易 Hash。');
        return { transactionHash: '0xCHAIN_SERVICE_DISABLED_OR_FAILED_TO_INIT' };
    }

    try {
        console.log(`[chain.js] 準備將紀錄上鏈: fingerprint=${fingerprint.slice(0,10)}..., ipfsHash=${ipfsHash.slice(0,10)}...`);
        const data = contract.methods.storeRecord(fingerprint, ipfsHash).encodeABI();

        const gasPrice = await web3.eth.getGasPrice();
        const gasEstimate = await contract.methods.storeRecord(fingerprint, ipfsHash).estimateGas({ from: account.address });

        const tx = {
            from: account.address,
            to: CONTRACT_ADDRESS,
            data,
            gas: gasEstimate,
            gasPrice
        };

        console.log('[chain.js] 正在發送交易...');
        const receipt = await web3.eth.sendTransaction(tx);
        console.log('[chain.js] 交易成功，交易 Hash:', receipt.transactionHash);
        return { transactionHash: receipt.transactionHash };

    } catch (err) {
        console.error('[chain.js] 將紀錄儲存至鏈上時發生錯誤:', err.message);
        // 返回 null 表示失敗，讓呼叫者可以進行後續處理
        return null;
    }
}

// 立即非同步地開始初始化過程，這不會阻塞應用程式的其他部分啟動
initializePromise = initChainService();

module.exports = { 
    storeRecord,
    // (可選) 導出初始化狀態，方便其他模組查詢
    isChainInitialized: () => isInitialized 
};
