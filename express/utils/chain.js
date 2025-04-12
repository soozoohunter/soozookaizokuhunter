const Web3 = require('web3');
require('dotenv').config();
const path = require('path');

const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
const contractAddress = process.env.CONTRACT_ADDRESS || '';
const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY || '0x012345...';

const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

// 假設 ABI 在 contracts/KaiKaiShieldStorage.abi.json
const contractABI = require(path.join(__dirname, '..', 'contracts', 'KaiKaiShieldStorage.abi.json'));
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

module.exports = {
  writeToBlockchain
};
