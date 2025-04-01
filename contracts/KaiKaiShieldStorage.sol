// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract KaiKaiShieldStorage {
    address public owner;
    mapping(bytes32 => bool) public storedFingerprint;

    constructor(){
        owner = msg.sender;
    }
    modifier onlyOwner(){
        require(msg.sender == owner, "Not authorized");
        _;
    }

    function storeFingerprint(bytes32 hash) public onlyOwner {
        require(!storedFingerprint[hash], "Already stored!");
        storedFingerprint[hash] = true;
    }
}
