// express/utils/chain.js
require('dotenv').config();
const { ethers } = require('ethers');

/**
 * 假設您在私有鏈上部署的 DataStorage.sol 合約之 ABI (示例)：
 * 以下為編譯後 artifacts 中擷取的 "abi" 區段；若您的真實合約有所增減，請改成對應的 JSON。
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
 * ★ 您指定要使用的合約位址 (硬編碼) ★
 * 如您確認此位址 "0x590CC0a45103883cEa6E27c9a4Cc356De6384aeb" 已部署對應 DataStorage.sol，則可直接用。
 */
const CONTRACT_ADDRESS = "0x590CC0a45103883cEa6E27c9a4Cc356De6384aeb";

/**
 * 假設您在 .env 中配置：
 *   ETH_NODE_URL=http://<你的私有鏈RPC或測試鏈RPC>
 *   ETH_PRIVATE_KEY=0x<你的EOA私鑰(64hex)>
 *
 * 例如：
 *   ETH_NODE_URL=http://127.0.0.1:8545
 *   ETH_PRIVATE_KEY=0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
 */
const { ETH_NODE_URL, ETH_PRIVATE_KEY } = process.env;

// 1) 透過 ethers 連線您的鏈節點
const provider = new ethers.providers.JsonRpcProvider(ETH_NODE_URL);

// 2) 用私鑰初始化錢包 (需確保該帳戶在私有鏈上有足夠餘額付 Gas)
const wallet = new ethers.Wallet(ETH_PRIVATE_KEY, provider);

// 3) 用合約地址 + ABI + wallet，得到合約實例
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

module.exports = {

  /**
   * writeToBlockchain(data)
   * @param {string} data - 要上鏈的資料(字串)
   * 呼叫合約的 storeRecord('GENERIC', data) 並等待交易確認
   */
  async writeToBlockchain(data){
    try {
      const tx = await contract.storeRecord('GENERIC', data);
      const receipt = await tx.wait();
      console.log(`[ETH] storeRecord(GENERIC, "${data}") => TX hash:`, receipt.transactionHash);
      return receipt.transactionHash;
    } catch(e){
      console.error('[writeToBlockchain Error]', e);
      throw e;
    }
  },

  /**
   * writeUserAssetToChain(userEmail, dnaHash, fileType, timestamp)
   * 用於上傳檔案 (短影音/圖片) 後，上鏈紀錄
   * recordType = 'ASSET'
   * data = "userEmail|dnaHash|fileType|timestamp"
   */
  async writeUserAssetToChain(userEmail, dnaHash, fileType, timestamp){
    try {
      const combined = `${userEmail}|${dnaHash}|${fileType}|${timestamp}`;
      const tx = await contract.storeRecord('ASSET', combined);
      const receipt = await tx.wait();
      console.log(`[ETH] storeRecord(ASSET, "${combined}") => TX hash:`, receipt.transactionHash);
      return receipt.transactionHash;
    } catch(e){
      console.error('[writeUserAssetToChain Error]', e);
      throw e;
    }
  },

  /**
   * writeInfringementToChain(userEmail, infrInfo, timestamp)
   * 用於記錄侵權事件
   * recordType = 'INFRINGE'
   * data = "userEmail|infrInfo|timestamp"
   */
  async writeInfringementToChain(userEmail, infrInfo, timestamp){
    try {
      const combined = `${userEmail}|${infrInfo}|${timestamp}`;
      const tx = await contract.storeRecord('INFRINGE', combined);
      const receipt = await tx.wait();
      console.log(`[ETH] storeRecord(INFRINGE, "${combined}") => TX hash:`, receipt.transactionHash);
      return receipt.transactionHash;
    } catch(e){
      console.error('[writeInfringementToChain Error]', e);
      throw e;
    }
  },

  /**
   * writeCustomRecord(recordType, data)
   * 可彈性傳入 recordType: 'REGISTER','UPGRADE','PLATFORM','ANY'
   * data: "自由字串" (e.g. "email=xxx@xxx|plan=PRO")
   */
  async writeCustomRecord(recordType, data){
    try {
      const tx = await contract.storeRecord(recordType, data);
      const receipt = await tx.wait();
      console.log(`[ETH] storeRecord(${recordType}, "${data}") => TX hash:`, receipt.transactionHash);
      return receipt.transactionHash;
    } catch(e){
      console.error('[writeCustomRecord Error]', e);
      throw e;
    }
  }
};
