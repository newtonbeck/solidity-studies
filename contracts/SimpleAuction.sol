// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract SimpleAuction {

    address payable public beneficiary;

    uint public auctionEndTime;

    constructor(
        uint biddingTime,
        address payable beneficiaryAddress
    ) {
        beneficiary = beneficiaryAddress;
        auctionEndTime = block.timestamp + biddingTime;
    }
}
