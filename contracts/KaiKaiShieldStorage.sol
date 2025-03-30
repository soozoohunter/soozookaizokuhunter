// soozookaizokuhunter/contracts/KaiKaiShieldStorage.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract KaiKaiShieldStorage {
    address public owner;

    mapping(bytes32 => bool) public storedFingerprint;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function storeFingerprint(bytes32 hash) public onlyOwner {
        require(!storedFingerprint[hash], "Already stored!");
        storedFingerprint[hash] = true;
    }
}
