// express/utils/chain.js

require('dotenv').config();
const { ethers } = require('ethers');

/**
 * 假設您在私有鏈上部署的合約 (類似 DataStorage.sol)，
 * 具有 storeRecord(recordType, data) function，
 * 並會 emit event RecordStored(address sender, string recordType, string data)。
 *
 * 以下 ABI 需與您實際部署的合約對應。
 */
const contractABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "recordType",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "data",
        "type": "string"
      }
    ],
    "name": "RecordStored",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "recordType",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "data",
        "type": "string"
      }
    ],
    "name": "storeRecord",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

/**
 * ★ 合約位址 (硬編碼) ★
 * 如果您已重新部署了新合約，請將下方地址替換為「實際部署成功後」的位址。
 */
const CONTRACT_ADDRESS = "0x590CC0a45103883cEa6E27c9a4Cc356De6384aeb";

/**
 * 從 .env 載入：
 * ETH_NODE_URL  => 您的私有鏈 / 測試鏈 RPC，例如 http://127.0.0.1:8545
 * ETH_PRIVATE_KEY => 您用來發送交易的 EOA 私鑰 (hex string，帶 0x)
 */
const { ETH_NODE_URL, ETH_PRIVATE_KEY } = process.env;

// 初始化 ethers.js
const provider = new ethers.providers.JsonRpcProvider(ETH_NODE_URL);
const wallet = new ethers.Wallet(ETH_PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

module.exports = {

  /**
   * 寫入「一般用途」資料。
   * recordType = 'GENERIC'
   * data = 您欲上鏈的字串
   */
  async writeToBlockchain(data) {
    try {
      // 調用 storeRecord('GENERIC', data)
      const tx = await contract.storeRecord('GENERIC', data);
      const receipt = await tx.wait();
      console.log(`[ETH] storeRecord(GENERIC, "${data}") => TX hash:`, receipt.transactionHash);
      return receipt.transactionHash;
    } catch (e) {
      console.error('[writeToBlockchain Error]', e);
      throw e;
    }
  },

  /**
   * 寫入「上傳檔案」(短影音 / 圖片) 的 fingerprint 等資訊。
   * recordType = 'ASSET'
   * data = "userEmail|dnaHash|fileType|timestamp"
   */
  async writeUserAssetToChain(userEmail, dnaHash, fileType, timestamp) {
    try {
      const combined = `${userEmail}|${dnaHash}|${fileType}|${timestamp}`;
      const tx = await contract.storeRecord('ASSET', combined);
      const receipt = await tx.wait();
      console.log(`[ETH] storeRecord(ASSET, "${combined}") => TX hash:`, receipt.transactionHash);
      return receipt.transactionHash;
    } catch (e) {
      console.error('[writeUserAssetToChain Error]', e);
      throw e;
    }
  },

  /**
   * 寫入「侵權舉報」資訊。
   * recordType = 'INFRINGE'
   * data = "userEmail|infrInfo|timestamp"
   */
  async writeInfringementToChain(userEmail, infrInfo, timestamp) {
    try {
      const combined = `${userEmail}|${infrInfo}|${timestamp}`;
      const tx = await contract.storeRecord('INFRINGE', combined);
      const receipt = await tx.wait();
      console.log(`[ETH] storeRecord(INFRINGE, "${combined}") => TX hash:`, receipt.transactionHash);
      return receipt.transactionHash;
    } catch (e) {
      console.error('[writeInfringementToChain Error]', e);
      throw e;
    }
  },

  /**
   * 自訂寫入，可依需求帶入 recordType, data。
   * 例如: 'REGISTER','UPGRADE','PLATFORM','ANY'
   */
  async writeCustomRecord(recordType, data) {
    try {
      const tx = await contract.storeRecord(recordType, data);
      const receipt = await tx.wait();
      console.log(`[ETH] storeRecord(${recordType}, "${data}") => TX hash:`, receipt.transactionHash);
      return receipt.transactionHash;
    } catch (e) {
      console.error('[writeCustomRecord Error]', e);
      throw e;
    }
  }
};
