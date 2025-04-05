// fastapi/app/contracts/KaiShield.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title KaiShield - 簡易侵權紀錄合約
 */
contract KaiShield {

    enum InfringementStatus {
        Pending,
        Legalized,
        DMCA,
        LicensingFeeRequested,
        Lawsuit
    }

    struct Work {
        uint256 id;              // workID
        address owner;           // 作者
        string hashFingerprint;  // 作品指紋
        string title;            // 作品標題
    }

    struct Infringement {
        uint256 id;             // infringement ID
        uint256 workId;
        string infringingUrl;
        InfringementStatus status;
    }

    uint256 public workCount;
    uint256 public infrCount;

    mapping(uint256 => Work) public works;
    mapping(uint256 => Infringement) public infringements;

    event WorkRegistered(uint256 workId, address owner, string hashFp, string title);
    event InfrRecorded(uint256 infrId, uint256 workId, string url);
    event MarkLegal(uint256 infrId);
    event DMCARequested(uint256 infrId);
    event LicenseFeeRequested(uint256 infrId, uint256 fee);
    event LawsuitStarted(uint256 infrId, uint256 demanded);

    // 註冊作品
    function registerWork(
        string memory _hashFingerprint,
        string memory _title
    ) external {
        workCount++;
        works[workCount] = Work(workCount, msg.sender, _hashFingerprint, _title);
        emit WorkRegistered(workCount, msg.sender, _hashFingerprint, _title);
    }

    // 新增侵權紀錄
    function recordInfringement(
        uint256 _workId,
        string memory _infringingUrl
    ) external {
        require(works[_workId].id == _workId, "Work not exist");
        infrCount++;
        infringements[infrCount] = Infringement(infrCount, _workId, _infringingUrl, InfringementStatus.Pending);
        emit InfrRecorded(infrCount, _workId, _infringingUrl);
    }

    // 標記合法
    function markAsLegal(uint256 _infrId) external {
        Infringement storage infr = infringements[_infrId];
        require(infr.id == _infrId, "Infr not exist");
        // 需檢查 invoker 是否為作品作者 or 具備管理員角色(此範例略過)
        infr.status = InfringementStatus.Legalized;
        emit MarkLegal(_infrId);
    }

    // 提出DMCA
    function requestDMCA(uint256 _infrId) external {
        Infringement storage infr = infringements[_infrId];
        require(infr.id == _infrId, "Infr not exist");
        infr.status = InfringementStatus.DMCA;
        emit DMCARequested(_infrId);
    }

    // 要求授權費
    function requestLicenseFee(uint256 _infrId, uint256 _fee) external {
        Infringement storage infr = infringements[_infrId];
        require(infr.id == _infrId, "Infr not exist");
        infr.status = InfringementStatus.LicensingFeeRequested;
        emit LicenseFeeRequested(_infrId, _fee);
    }

    // 提起訴訟
    function startLawsuit(uint256 _infrId, uint256 _demanded) external {
        Infringement storage infr = infringements[_infrId];
        require(infr.id == _infrId, "Infr not exist");
        infr.status = InfringementStatus.Lawsuit;
        emit LawsuitStarted(_infrId, _demanded);
    }
}
