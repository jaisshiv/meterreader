// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MeterLog {
    struct MeterReading {
        uint256 timestamp;
        string utility;
        uint256 value;
        bytes32 hash;
    }

    MeterReading[] public readings;

    event ReadingStored(string utility, uint256 value, bytes32 hash);

    function storeReading(string calldata utility, uint256 value, bytes32 hash) external {
        readings.push(MeterReading(block.timestamp, utility, value, hash));
        emit ReadingStored(utility, value, hash);
    }

    function getReadingCount() external view returns (uint256) {
        return readings.length;
    }
}
