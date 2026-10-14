// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FinovaDecisionRegistry
 * @dev Academic Project: "AI–Voice Financial Intelligence Network Using Blockchain"
 * Stores immutable cryptographic SHA-256 digests of financial risk intelligence decisions.
 */
contract FinovaDecisionRegistry {
    address public immutable owner;

    struct DecisionProof {
        bytes32 canonicalHash;    // SHA-256 digest of canonical JSON decision payload
        string transactionRef;    // e.g. "TXN-2026-107"
        uint256 riskScore;        // 0 to 100
        string riskCategory;      // "low", "moderate", "high", "critical"
        uint256 timestamp;        // Block timestamp when registered
        address recordedBy;       // Compliance officer address
    }

    // Mapping from decisionId (e.g. "DEC-2026-801") to DecisionProof
    mapping(string => DecisionProof) private _registry;
    
    // Total count of verified records anchored on-chain
    uint256 public totalDecisionsRecorded;

    event DecisionAnchored(
        string indexed decisionId,
        bytes32 indexed canonicalHash,
        string transactionRef,
        uint256 riskScore,
        uint256 timestamp
    );

    error DecisionAlreadyExists(string decisionId);
    error DecisionNotFound(string decisionId);
    error Unauthorized();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Anchors a cryptographic decision hash to the public Ethereum ledger
     * @param decisionId Unique business reference for the decision report
     * @param canonicalHash SHA-256 hash of the canonical JSON decision
     * @param transactionRef Underlying transaction identifier
     * @param riskScore Evaluated risk score (0-100)
     * @param riskCategory Category string (e.g. "high")
     */
    function recordDecision(
        string calldata decisionId,
        bytes32 canonicalHash,
        string calldata transactionRef,
        uint256 riskScore,
        string calldata riskCategory
    ) external {
        if (_registry[decisionId].timestamp != 0) {
            revert DecisionAlreadyExists(decisionId);
        }

        _registry[decisionId] = DecisionProof({
            canonicalHash: canonicalHash,
            transactionRef: transactionRef,
            riskScore: riskScore,
            riskCategory: riskCategory,
            timestamp: block.timestamp,
            recordedBy: msg.sender
        });

        totalDecisionsRecorded += 1;

        emit DecisionAnchored(
            decisionId,
            canonicalHash,
            transactionRef,
            riskScore,
            block.timestamp
        );
    }

    /**
     * @notice Verifies if a given hash matches the immutable on-chain record
     * @param decisionId Identifier of the record to check
     * @param candidateHash Candidate SHA-256 hash calculated from current payload
     */
    function verifyIntegrity(
        string calldata decisionId,
        bytes32 candidateHash
    ) external view returns (bool isValid, uint256 anchoredTimestamp, address recordedBy) {
        DecisionProof memory proof = _registry[decisionId];
        if (proof.timestamp == 0) {
            revert DecisionNotFound(decisionId);
        }

        isValid = (proof.canonicalHash == candidateHash);
        return (isValid, proof.timestamp, proof.recordedBy);
    }

    /**
     * @notice Retrieves full on-chain proof for a decision
     */
    function getDecisionProof(string calldata decisionId)
        external
        view
        returns (
            bytes32 canonicalHash,
            string memory transactionRef,
            uint256 riskScore,
            string memory riskCategory,
            uint256 timestamp,
            address recordedBy
        )
    {
        DecisionProof memory proof = _registry[decisionId];
        if (proof.timestamp == 0) {
            revert DecisionNotFound(decisionId);
        }

        return (
            proof.canonicalHash,
            proof.transactionRef,
            proof.riskScore,
            proof.riskCategory,
            proof.timestamp,
            proof.recordedBy
        );
    }
}
