const { Web3 } = require('web3');
const logger = require('./logger');
const { getABI } = require('./contract'); // 假設您有此輔助函式

let web3;
let contract;
let account;
let isInitialized = false;

const MAX_RETRIES = 15;
const RETRY_DELAY = 5000;

/** 若餘額不足 1 ETH 則由 funding account 補款 */
async function autoFundIfNeeded(web3Instance, target) {
  const minWei = web3Instance.utils.toWei('1', 'ether');
  const balWei = await web3Instance.eth.getBalance(target);
  if (BigInt(balWei) >= BigInt(minWei)) return;

  const fundPK = process.env.GANACHE_FUNDING_ACCOUNT;
  if (!fundPK) {
    logger.warn('[Chain] No funding account provided; skipping auto-fund.');
    return;
  }

  const fundAcc = web3Instance.eth.accounts.privateKeyToAccount(fundPK);
  logger.warn(`[Chain] Funding ${target}. Current ${web3Instance.utils.fromWei(balWei)} ETH`);

  const tx = {
    from: fundAcc.address,
    to: target,
    value: web3Instance.utils.toWei('100', 'ether'),
    gas: 21000,
    gasPrice: await web3Instance.eth.getGasPrice(),
  };

  const signed = await fundAcc.signTransaction(tx);
  await web3Instance.eth.sendSignedTransaction(signed.rawTransaction);
  logger.info('[Chain] Funding complete.');
}

async function initializeBlockchainService() {
    if (isInitialized) return;

    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
    const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!rpcUrl || !privateKey || !contractAddress) {
        throw new Error("Blockchain configuration is missing (RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS).");
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            logger.info(`[Chain] Attempt ${attempt}/${MAX_RETRIES} to connect to blockchain node at ${rpcUrl}...`);
            web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
            
            const isListening = await web3.eth.net.isListening();
            if (!isListening) throw new Error("Node is not listening.");
            
            account = web3.eth.accounts.privateKeyToAccount(privateKey);
            web3.eth.accounts.wallet.add(account);
            web3.eth.defaultAccount = account.address;

            // ---------- auto fund account if balance low ----------
            await autoFundIfNeeded(web3, account.address);
            
            const abi = getABI('Copyright'); // 確保您的合約 ABI 正確
            contract = new web3.eth.Contract(abi, contractAddress);
            
            isInitialized = true;
            logger.info(`[Chain] Blockchain service initialized successfully. Wallet address: ${account.address}`);
            return; // 成功後退出循環

        } catch (error) {
            logger.error(`[Chain] Connection attempt ${attempt} failed: ${error.message}`);
            if (attempt === MAX_RETRIES) {
                throw new Error("Could not initialize blockchain service after maximum retries.");
            }
            await new Promise(res => setTimeout(res, RETRY_DELAY));
        }
    }
}

async function storeRecord(fingerprint, ipfsHash) {
    if (!isInitialized) throw new Error('Blockchain service is not ready.');
    
    logger.info(`[Chain] Preparing to store record on-chain for fingerprint: ${fingerprint.substring(0, 10)}...`);
    try {
        const fromAddress = account.address;
        const gasPrice    = await web3.eth.getGasPrice();
        const estimatedGas = await contract.methods.storeRecord(fingerprint, ipfsHash).estimateGas({ from: fromAddress });

        const costWei = BigInt(gasPrice) * BigInt(estimatedGas);
        const balance = BigInt(await web3.eth.getBalance(fromAddress));
        if (balance < costWei) {
            // try auto fund
            await autoFundIfNeeded(web3, fromAddress);
            const newBal = BigInt(await web3.eth.getBalance(fromAddress));
            if (newBal < costWei) {
                logger.warn('[Chain] Skip – still insufficient after funding.');
                return { skipped: true, reason: 'insufficient_funds' };
            }
        }

        const receipt = await contract.methods.storeRecord(fingerprint, ipfsHash).send({
            from: fromAddress,
            gas:  estimatedGas,
            gasPrice
        });

        logger.info(`[Chain] Transaction successful! TxHash: ${receipt.transactionHash}`);
        return receipt;
    } catch (error) {
        logger.error(`[Chain] Blockchain transaction failed: ${error.message}`);
        throw error;
    }
}

async function getHealthStatus() {
    if (!isInitialized) return { status: 'unhealthy', message: 'Service not initialized.' };
    try {
        const isListening = await web3.eth.net.isListening();
        return isListening 
            ? { status: 'healthy', message: 'Service is listening.' }
            : { status: 'unhealthy', message: 'Service is not listening.' };
    } catch (error) {
        return { status: 'unhealthy', message: error.message };
    }
}

module.exports = { initializeBlockchainService, storeRecord, getHealthStatus };
