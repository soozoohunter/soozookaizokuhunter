// express/utils/chain.js
const Web3 = require('web3');
require('dotenv').config();

const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
const contractAddress = process.env.CONTRACT_ADDRESS;
const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;

const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

// 假設 abi.json 放在 express/contracts/KaiKaiShieldStorage.abi.json
const contractABI = require('../contracts/KaiKaiShieldStorage.abi.json');

const contract = new web3.eth.Contract(contractABI, contractAddress);

function getAccount() {
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
  return account;
}

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

async function writeUserAssetToChain(userEmail, dnaHash, fileType, timestamp) {
  const account = getAccount();
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
