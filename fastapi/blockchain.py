import os
from web3 import Web3
from solcx import compile_standard

RPC_URL = os.getenv("BLOCKCHAIN_RPC_URL","http://geth:8545")
PRIVATE_KEY = os.getenv("BLOCKCHAIN_PRIVATE_KEY","0x1111")
contract_address = os.getenv("CONTRACT_ADDRESS","")

w3 = Web3(Web3.HTTPProvider(RPC_URL))
account = w3.eth.account.from_key(PRIVATE_KEY)

def deploy_contract():
    with open('/app/contracts/KaiKaiShieldStorage.sol','r') as f:
        source = f.read()
    compiled = compile_standard({
        "language":"Solidity",
        "sources":{
            "KaiKaiShieldStorage.sol":{"content":source}
        },
        "settings":{
            "outputSelection":{
                "*":{"*":["abi","evm.bytecode"]}
            }
        }
    })
    bytecode = compiled["contracts"]["KaiKaiShieldStorage.sol"]["KaiKaiShieldStorage"]["evm"]["bytecode"]["object"]
    abi = compiled["contracts"]["KaiKaiShieldStorage.sol"]["KaiKaiShieldStorage"]["abi"]

    chain_id = w3.eth.chain_id
    KaiContract = w3.eth.contract(abi=abi, bytecode=bytecode)

    tx = KaiContract.constructor().buildTransaction({
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
        "gas": 5000000,
        "gasPrice": w3.toWei('1','gwei'),
        "chainId": chain_id
    })
    signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return receipt.contractAddress

def upload_to_chain(data:bytes):
    # 示例: 直接將 data 放進 to=account.address
    tx = {
        "nonce": w3.eth.get_transaction_count(account.address),
        "to": account.address,
        "value": 0,
        "gas": 210000,
        "gasPrice": w3.toWei('1','gwei'),
        "data": data
    }
    signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    return w3.toHex(tx_hash)
