/**
 * express/services/blockchainService.js
 * - 整合 Web3 + Ganache
 * - registerUserOnBlockchain(...)：將用戶註冊資訊寫入合約
 */
require('dotenv').config();
const Web3 = require('web3');

const {
  GANACHE_URL,
  GANACHE_PRIVATE_KEY,
  GANACHE_CONTRACT_ADDRESS
} = process.env;

// 初始化 web3 與帳戶
const web3 = new Web3(new Web3.providers.HttpProvider(GANACHE_URL));
const account = web3.eth.accounts.privateKeyToAccount(GANACHE_PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

// ★ 您的合約 ABI (JSON 陣列)，請替換成實際版本
const contractABI = [
  // 假設存在:
  // function registerUser(string memory userName, string memory role, string memory accountsJson, string memory serialNumber) public
];

const contract = new web3.eth.Contract(contractABI, GANACHE_CONTRACT_ADDRESS);

/**
 * registerUserOnBlockchain
 * @param {string} userName - 用戶名稱
 * @param {string} role - 用戶角色
 * @param {string} serialNumber - 系統為使用者生成的序號 (可為 UUID)
 * @param {object} accountsObj - { IG, FB, Shopee... } 需上鏈的社群/電商帳號
 */
async function registerUserOnBlockchain(userName, role, serialNumber, accountsObj) {
  try {
    // 轉成 JSON
    const accountsJson = JSON.stringify(accountsObj);

    // 準備呼叫合約方法
    const txData = contract.methods
      .registerUser(userName, role, accountsJson, serialNumber)
      .encodeABI();

    // 預估 gas
    const gas = await contract.methods
      .registerUser(userName, role, accountsJson, serialNumber)
      .estimateGas({ from: account.address });

    // 組交易物件
    const tx = {
      to: GANACHE_CONTRACT_ADDRESS,
      data: txData,
      gas
    };

    // 簽名並發送交易
    const signedTx = await web3.eth.accounts.signTransaction(tx, GANACHE_PRIVATE_KEY);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    console.log('[blockchainService] Tx success:', receipt.transactionHash);
    return receipt.transactionHash;
  } catch (err) {
    console.error('[blockchainService] registerUserOnBlockchain error:', err);
    throw err;
  }
}

module.exports = { registerUserOnBlockchain };
