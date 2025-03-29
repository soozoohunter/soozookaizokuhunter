// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract KaiKaiShieldStorage {
    address public owner;

    struct Infringement {
        string infringingUrl;
        string evidence;
        uint256 timestamp;
    }

    mapping(bytes32 => bool) public storedFingerprint;
    mapping(bytes32 => Infringement[]) public infringements;

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

    function recordInfringement(bytes32 hash, string memory infringingUrl, string memory evidence) public onlyOwner {
        require(storedFingerprint[hash], "Fingerprint not found!");
        Infringement memory inf = Infringement({
            infringingUrl: infringingUrl,
            evidence: evidence,
            timestamp: block.timestamp
        });
        infringements[hash].push(inf);
    }
}
