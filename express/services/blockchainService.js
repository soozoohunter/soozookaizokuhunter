/**
 * express/services/blockchainService.js
 * - 根據 KaiKaiShieldStorage.abi.json 進行最終修正
 * - 所有上鏈操作均透過合約的 storeData(string) 方法
 */
require('dotenv').config();
const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

// --- [核心設定] ---
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL;
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// --- [初始化 Web3、合約、帳戶] ---
let web3;
let contract;
let account;
let isInitialized = false;

try {
  // 檢查所有必要的環境變數是否存在
  if (!RPC_URL || !CONTRACT_ADDRESS || !PRIVATE_KEY) {
    throw new Error(
      'FATAL ERROR: Blockchain service cannot be initialized. ' +
      'Please ensure BLOCKCHAIN_RPC_URL, CONTRACT_ADDRESS, and BLOCKCHAIN_PRIVATE_KEY are set in your .env file.'
    );
  }

  // 【修正1】: 更新 ABI 檔案路徑與載入方式
  const abiPath = path.join(__dirname, '../contracts/KaiKaiShieldStorage.abi.json');
  if (!fs.existsSync(abiPath)) {
      throw new Error(`Contract ABI file not found at ${abiPath}. Please check the path and filename.`);
  }
  // 您的 ABI 檔案本身就是一個 JSON 陣列，所以直接 parse 即可
  const contractABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  if (!Array.isArray(contractABI)) {
      throw new Error(`ABI loaded from ${abiPath} is not a valid array. Check the JSON file structure.`);
  }


  web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL));

  account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;

  contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);
  
  isInitialized = true;
  console.log(`[Service] Blockchain service initialized successfully. Contract: ${CONTRACT_ADDRESS}, Account: ${account.address}`);

} catch (err) {
  console.error('[Service] FATAL: Blockchain service initialization failed:', err.message);
}

/**
 * 【修正2】: 重構 storeUserOnChain 函式
 * 將使用者資料打包成 JSON 字串，並呼叫 storeData 方法
 * @param {object} userData - 包含使用者資訊的物件
 */
async function storeUserOnChain(userData) {
  if (!isInitialized) {
    console.error('Blockchain service is not available. Skipping storeUserOnChain.');
    return;
  }

  try {
    // 建立一個標準化的資料結構，包含類型以便未來區分
    const dataToStore = {
        type: 'USER_REGISTRATION',
        timestamp: new Date().toISOString(),
        payload: userData
    };
    const jsonString = JSON.stringify(dataToStore);

    console.log(`[Chain] Storing user data for: ${userData.username}`);

    const gas = await contract.methods.storeData(jsonString).estimateGas({ from: account.address });
    const tx = await contract.methods.storeData(jsonString).send({
        from: account.address,
        gas: gas.toString()
    });

    console.log(`[Chain] User data stored successfully. Transaction hash: ${tx.transactionHash}`);
    return tx;
  } catch (error) {
    console.error(`[Chain] Error storing user data for ${userData.username}:`, error.message);
    // 即使上鏈失敗也只記錄錯誤，不讓整個 API 請求失敗
  }
}

/**
 * 【修正3】: 重構 storeRecord 函式
 * 將檔案存證資料打包成 JSON 字串，並呼叫 storeData 方法
 * @param {string} fingerprint - 檔案的 SHA256 指紋
 * @param {string} ipfsHash - 檔案的 IPFS CID
 */
async function storeRecord(fingerprint, ipfsHash) {
    if (!isInitialized) {
        console.error('Blockchain service is not available. Skipping storeRecord.');
        return;
    }

    try {
        // 建立一個標準化的資料結構
        const dataToStore = {
            type: 'FILE_RECORD',
            timestamp: new Date().toISOString(),
            payload: {
                fingerprint: fingerprint,
                ipfsHash: ipfsHash
            }
        };
        const jsonString = JSON.stringify(dataToStore);

        console.log(`[Chain] Storing file record for fingerprint: ${fingerprint}`);

        const gas = await contract.methods.storeData(jsonString).estimateGas({ from: account.address });
        const receipt = await contract.methods.storeData(jsonString).send({ from: account.address, gas: gas.toString() });

        console.log(`[Chain] File record stored successfully. Tx Hash: ${receipt.transactionHash}`);
        return receipt;
    } catch (err) {
        console.error(`[Chain] Error storing file record for fingerprint ${fingerprint}:`, err.message);
        throw err;
    }
}


module.exports = {
  storeUserOnChain,
  storeRecord,
  isReady: isInitialized
};
