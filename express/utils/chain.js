require('dotenv').config();
const axios = require('axios');
const Web3EthAbi = require('web3-eth-abi');
const Web3EthAccounts = require('web3-eth-accounts');

const { BLOCKCHAIN_RPC_URL, BLOCKCHAIN_PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;

if (!BLOCKCHAIN_RPC_URL || !BLOCKCHAIN_PRIVATE_KEY || !CONTRACT_ADDRESS) {
  console.warn('[chain.js] 區塊鏈環境變數設定不足');
}

const privateKey = BLOCKCHAIN_PRIVATE_KEY.startsWith('0x')
  ? BLOCKCHAIN_PRIVATE_KEY
  : '0x' + BLOCKCHAIN_PRIVATE_KEY;
const account = new Web3EthAccounts().privateKeyToAccount(privateKey);
const fromAddress = account.address;

async function rpcCall(method, params=[]) {
  const payload = { jsonrpc:'2.0', id:1, method, params };
  const resp = await axios.post(BLOCKCHAIN_RPC_URL, payload, {
    headers:{ 'Content-Type':'application/json' }
  });
  if (resp.data.error) {
    throw new Error(`RPC Error: ${resp.data.error.message}`);
  }
  return resp.data.result;
}

async function waitForReceipt(txHash, timeoutMs=15000, pollMs=1000) {
  const start = Date.now();
  while ((Date.now() - start) < timeoutMs) {
    const receipt = await rpcCall('eth_getTransactionReceipt',[txHash]);
    if (receipt) return receipt;
    await new Promise(r=>setTimeout(r, pollMs));
  }
  throw new Error(`Transaction ${txHash} not mined within ${timeoutMs}ms`);
}

// storeRecord
async function storeRecord(fingerprint, ipfsHash='') {
  try {
    // encode storeRecord(string,string)
    const data = Web3EthAbi.encodeFunctionCall({
      name:'storeRecord',
      type:'function',
      inputs:[
        { name:'fingerprint', type:'string' },
        { name:'ipfsHash', type:'string' }
      ]
    }, [fingerprint, ipfsHash]);

    const nonce = await rpcCall('eth_getTransactionCount',[fromAddress,'pending']);
    const gasPrice = await rpcCall('eth_gasPrice',[]);
    const gas = await rpcCall('eth_estimateGas',[{
      from:fromAddress,
      to:CONTRACT_ADDRESS,
      data
    }]);
    const chainIdHex = await rpcCall('eth_chainId',[]);
    const chainId = parseInt(chainIdHex,16);

    const txParams = {
      from: fromAddress,
      to: CONTRACT_ADDRESS,
      value:'0x0',
      data,
      nonce,
      gas,
      gasPrice,
      chainId
    };
    const signed = await account.signTransaction(txParams);
    const txHash = await rpcCall('eth_sendRawTransaction',[signed.rawTransaction]);
    const receipt = await waitForReceipt(txHash);
    return receipt;
  } catch(e){
    console.error('[storeRecord Error]', e);
    throw e;
  }
}

module.exports = { storeRecord };
