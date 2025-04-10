// contracts/KaiKaiShieldStorage.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract KaiKaiShieldStorage {
    // 簡單存一個字串
    string public storedData;

    event DataStored(string data);

    function storeData(string calldata _data) external {
        storedData = _data;
        emit DataStored(_data);
    }

    // 讀取
    function getData() external view returns (string memory) {
        return storedData;
    }
}
