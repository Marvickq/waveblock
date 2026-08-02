// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WaveBlockTrustRegistry
 * @notice Stores an immutable hash of each AI-generated Trust Report.
 *         Anyone can verify that a report existed at a given time.
 */
contract WaveBlockTrustRegistry {
    address public owner;
    uint256 public reportCount;

    struct ReportRecord {
        bytes32 reportHash;
        uint256 timestamp;
        string tokenAddress;
    }

    mapping(uint256 => ReportRecord) public reports;
    mapping(bytes32 => bool) public hashExists;

    event ReportSaved(
        uint256 indexed id,
        bytes32 indexed reportHash,
        string tokenAddress,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Store a keccak256 hash of a Trust Report.
     * @param reportHash The keccak256 hash of the report content.
     * @param tokenAddress The ERC-20 token address the report is for.
     * @return id The unique ID of the stored record.
     */
    function saveReportHash(
        bytes32 reportHash,
        string calldata tokenAddress
    ) external onlyOwner returns (uint256 id) {
        require(!hashExists[reportHash], "Hash already exists");

        id = reportCount;
        reports[id] = ReportRecord({
            reportHash: reportHash,
            timestamp: block.timestamp,
            tokenAddress: tokenAddress
        });
        hashExists[reportHash] = true;
        reportCount++;

        emit ReportSaved(id, reportHash, tokenAddress, block.timestamp);
    }

    /**
     * @notice Retrieve a stored report hash by its ID.
     * @param id The report record ID.
     * @return reportHash The stored keccak256 hash.
     * @return timestamp The block timestamp when saved.
     * @return tokenAddress The token address the report is for.
     */
    function getReportHash(
        uint256 id
    )
        external
        view
        returns (bytes32 reportHash, uint256 timestamp, string memory tokenAddress)
    {
        require(id < reportCount, "Report does not exist");
        ReportRecord storage record = reports[id];
        return (record.reportHash, record.timestamp, record.tokenAddress);
    }

    /**
     * @notice Verify whether a report hash exists on-chain.
     * @param reportHash The keccak256 hash to verify.
     * @return exists Whether the hash is stored.
     * @return id The record ID if it exists.
     */
    function verifyReport(
        bytes32 reportHash
    ) external view returns (bool exists, uint256 id) {
        exists = hashExists[reportHash];
        if (exists) {
            for (uint256 i = 0; i < reportCount; i++) {
                if (reports[i].reportHash == reportHash) {
                    id = i;
                    break;
                }
            }
        }
    }
}
