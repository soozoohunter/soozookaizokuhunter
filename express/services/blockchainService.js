/**
 * express/services/blockchainService.js
 * - 修正環境變數讀取錯誤
 * - 修正合約 ABI 載入方式
 * - 增加初始化檢查，提升程式健壯性
 */
require('dotenv').config();
const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

// --- [核心設定] ---
// 【修正1】: 改為讀取您 .env 檔案中正確的變數名稱 (BLOCKCHAIN_... 而非 GANACHE_...)
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL;
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// --- [初始化 Web3、合約、帳戶] ---
let web3;
let contract;
let account;
let isInitialized = false;

try {
  // 【修正2】: 在初始化前，嚴格檢查所有必要的環境變數是否存在
  if (!RPC_URL || !CONTRACT_ADDRESS || !PRIVATE_KEY) {
    throw new Error(
      'FATAL ERROR: Blockchain service cannot be initialized. ' +
      'Please ensure BLOCKCHAIN_RPC_URL, CONTRACT_ADDRESS, and BLOCKCHAIN_PRIVATE_KEY are set in your .env file.'
    );
  }

  // 【修正3】: 從 JSON 檔案動態載入合約 ABI
  // 根據先前日誌，您的合約 ABI 應該在類似 'express/contracts/KaiShield.json' 的位置
  const abiPath = path.join(__dirname, '../contracts/KaiShield.json');
  if (!fs.existsSync(abiPath)) {
      throw new Error(`Contract ABI file not found at ${abiPath}. Please check the path.`);
  }
  const contractABI = JSON.parse(fs.readFileSync(abiPath, 'utf8')).abi;
  if (!contractABI) {
      throw new Error(`ABI not found in ${abiPath}. Check the JSON file structure.`);
  }


  web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL));

  // 將私鑰載入錢包，並設定為預設帳戶
  account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;

  contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);
  
  isInitialized = true;
  console.log(`[Service] Blockchain service initialized successfully. Default account: ${account.address}`);

} catch (err) {
  console.error('[Service] FATAL: Blockchain service initialization failed:', err.message);
  // 讓 isInitialized 維持 false，後續函式呼叫會知道服務不可用
}


/**
 * 【修正4】: 函式名稱與 authController.js 中的呼叫保持一致
 * 將使用者資料寫入區塊鏈
 * @param {object} userData - 包含使用者資訊的物件
 */
async function storeUserOnChain(userData) {
  if (!isInitialized) {
    console.error('Blockchain service is not available. Skipping storeUserOnChain.');
    return; // 直接返回，不拋出錯誤中斷流程
  }

  try {
    const { userName, role, serialNumber, ...accountsObj } = userData;
    const accountsJson = JSON.stringify(accountsObj);

    console.log(`[Chain] Storing user data for: ${userName}`);

    // 【修正5】: 確保呼叫的合約方法名稱 'registerUser' 與您合約中的一致
    const gas = await contract.methods
      .registerUser(userName, role, accountsJson, serialNumber)
      .estimateGas({ from: account.address });

    const tx = await contract.methods
      .registerUser(userName, role, accountsJson, serialNumber)
      .send({
        from: account.address,
        gas: gas.toString()
      });

    console.log(`[Chain] User data stored successfully. Transaction hash: ${tx.transactionHash}`);
    return tx;
  } catch (error) {
    console.error(`[Chain] Error storing user data for ${userData.username}:`, error.message);
    // 即使上鏈失敗也只記錄錯誤，不讓整個 API 請求失敗
    // throw error; // 如果希望上鏈失敗時讓請求失敗，可以取消此行註解
  }
}

/**
 * 將檔案存證資料寫入區塊鏈
 * (此函式來自於您 protect.js 中的 chain.js，現整合於此)
 * @param {string} fingerprint - 檔案的 SHA256 指紋
 * @param {string} ipfsHash - 檔案的 IPFS CID
 */
async function storeRecord(fingerprint, ipfsHash) {
    if (!isInitialized) {
        console.error('Blockchain service is not available. Skipping storeRecord.');
        return;
    }

    try {
        console.log(`[Chain] Storing file record for fingerprint: ${fingerprint}`);
        const gas = await contract.methods.storeRecord(fingerprint, ipfsHash).estimateGas({ from: account.address });
        const receipt = await contract.methods.storeRecord(fingerprint, ipfsHash).send({ from: account.address, gas: gas.toString() });
        console.log(`[Chain] File record stored successfully. Tx Hash: ${receipt.transactionHash}`);
        return receipt;
    } catch (err) {
        console.error(`[Chain] Error storing file record for fingerprint ${fingerprint}:`, err.message);
        throw err;
    }
}


module.exports = {
  storeUserOnChain,
  storeRecord, // 也匯出這個函式
  isReady: isInitialized
};
