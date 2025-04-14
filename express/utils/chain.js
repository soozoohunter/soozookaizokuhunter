/********************************************************************
 * utils/chain.js (ethers v6)
 ********************************************************************/
require('dotenv').config();
const { ethers } = require('ethers');

const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY || '';
const contractAddress = process.env.CONTRACT_ADDRESS || '';

const KaiKaiShieldABI = [
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
  // 若需要 getRecordByFingerprint, 也可加在這
];

let provider, wallet, contract;

try {
  provider = new ethers.JsonRpcProvider(rpcUrl);
  wallet = new ethers.Wallet(privateKey, provider);
  contract = new ethers.Contract(contractAddress, KaiKaiShieldABI, wallet);
  console.log(`[chain.js] connected to chain, contract=${contractAddress}, wallet=${wallet.address}`);
} catch (err) {
  console.error('[chain.js] init error:', err);
}

async function storeFileRecord(fingerprint, ipfsHash) {
  if (!contract) {
    throw new Error('No contract instance');
  }
  const tx = await contract.storeRecord(fingerprint, ipfsHash);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

module.exports = {
  storeFileRecord
};
