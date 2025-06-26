/**
 * express/utils/contract.js
 * * 這個檔案是智慧合約的 ABI (Application Binary Interface) 管理中心。
 * 它提供一個統一的函式來根據合約名稱獲取其對應的 ABI。
 * 這樣做可以讓程式碼更整潔，當未來有多個合約時也易於管理。
 */

// 這是您的版權存證智慧合約的 ABI，後端邏輯是基於此 ABI 設計的。
const CopyrightABI = [
    // --- Functions ---
    // 儲存新紀錄的函式 (會寫入區塊鏈)
    // 它接受一個指紋和一個 IPFS Hash，這與 protect.js 的需求一致。
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_fingerprint",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_ipfsHash",
                "type": "string"
            }
        ],
        "name": "storeRecord",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // --- Events ---
    // 當有新紀錄被儲存時觸發的事件
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "fingerprint",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "ipfsHash",
                "type": "string"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "RecordStored",
        "type": "event"
    }
];


/**
 * 根據合約名稱返回其 ABI。
 * @param {string} name - 合約的名稱 (例如 'Copyright')。
 * @returns {Array|null} - 返回對應的 ABI 陣列，如果找不到則返回 null。
 */
function getABI(name) {
    // 目前系統只使用 'Copyright' 這份 ABI
    switch (name.toLowerCase()) {
        case 'copyright':
            return CopyrightABI;
        // 如果未來要整合 KaiShield.sol，可以在這裡新增它的 ABI
        // case 'kaishield':
        //     return KaiShieldABI;
        default:
            console.error(`[Contract Helper] ABI not found for contract: ${name}`);
            return null;
    }
}

module.exports = {
    getABI,
};
