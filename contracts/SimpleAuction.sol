// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract SimpleAuction {

    address payable public beneficiary;

    uint public auctionEndTime;

    /// Error thrown when current block timestamp
    /// is higher than `auctionEndTime`
    error AuctionAlreadyEnded();

    constructor(
        uint biddingTime,
        address payable beneficiaryAddress
    ) {
        beneficiary = beneficiaryAddress;
        auctionEndTime = block.timestamp + biddingTime;
    }

    function bid() external payable {
        if (block.timestamp > auctionEndTime) {
            revert AuctionAlreadyEnded();
        }
    }
}
