const Web3 = require('web3');
require('dotenv').config();

const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

const contractAddress = process.env.CONTRACT_ADDRESS;
const contractABI = require('../../contracts/KaiKaiShieldStorage.abi.json');

const contract = new web3.eth.Contract(contractABI, contractAddress);

function getAccount() {
  const account = web3.eth.accounts.privateKeyToAccount(process.env.BLOCKCHAIN_PRIVATE_KEY);
  web3.eth.accounts.wallet.add(account);
  return account;
}

/**
 * 寫入最原始的 data
 */
async function writeToBlockchain(data) {
  const account = getAccount();
  const tx = {
    from: account.address,
    to: contractAddress,
    data: contract.methods.storeData(data).encodeABI(),
    gas: 2000000
  };
  const receipt = await web3.eth.sendTransaction(tx);
  return receipt.transactionHash;
}

/**
 * 將使用者上傳檔案指紋 (DNAHash) 等資訊寫入鏈上
 */
async function writeUserAssetToChain(userEmail, dnaHash, fileType, timestamp) {
  const account = getAccount();
  // Demo: 將資料以 "USER:xxx|DNA:xxx|TYPE:xxx|TS:xxx" 形式一起存
  const combined = `USER:${userEmail}|DNA:${dnaHash}|TYPE:${fileType}|TS:${timestamp}`;
  const tx = {
    from: account.address,
    to: contractAddress,
    data: contract.methods.storeData(combined).encodeABI(),
    gas: 2000000
  };
  const receipt = await web3.eth.sendTransaction(tx);
  return receipt.transactionHash;
}

/**
 * 將侵權資訊寫入鏈上
 */
async function writeInfringementToChain(userEmail, infrInfo, timestamp) {
  const account = getAccount();
  const combined = `USER:${userEmail}|INFR:${infrInfo}|TS:${timestamp}`;
  const tx = {
    from: account.address,
    to: contractAddress,
    data: contract.methods.storeData(combined).encodeABI(),
    gas: 2000000
  };
  const receipt = await web3.eth.sendTransaction(tx);
  return receipt.transactionHash;
}

module.exports = {
  writeToBlockchain,
  writeUserAssetToChain,
  writeInfringementToChain
};
