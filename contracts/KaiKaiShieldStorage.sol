// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract KaiKaiShieldStorage {
    struct Infringement {
        string infringingUrl;
        string evidence;
        uint256 timestamp;
    }

    mapping(bytes32 => bool) public storedFingerprint;
    mapping(bytes32 => Infringement[]) public infringements;

    function storeFingerprint(bytes32 hash) public {
        require(!storedFingerprint[hash], "Already stored!");
        storedFingerprint[hash] = true;
    }

    function recordInfringement(bytes32 hash, string memory infringingUrl, string memory evidence) public {
        require(storedFingerprint[hash], "Fingerprint not found!");
        infringements[hash].push(Infringement(infringingUrl, evidence, block.timestamp));
    }
}
