// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract KaiKaiShieldStorage {
    string public data;
    
    event DataStored(string data);

    function storeData(string memory _data) public {
        data = _data;
        emit DataStored(_data);
    }
}
