// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract SimpleAuction {

    address payable public beneficiary;

    uint public auctionEndTime;

    address public highestBidder;
    uint public highestBid;

    mapping(address => uint) public refunds;

    /// Error thrown when current block timestamp
    /// is higher than `auctionEndTime`
    error AuctionAlreadyEnded();

    /// Error thrown when current bid is
    /// smaller than `highestBid`
    error BidNotHighEnough(uint highestBid);

    /// Error thrown when address does not
    /// have any refunds to receive in the refunds list
    error AddressDoesNotHaveAnyRefundToReceive(address address_);

    /// Event fired when the highest bid increased
    event HighestBidIncreased(address highestBidder, uint highestBid);

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

        if (msg.value < highestBid) {
            revert BidNotHighEnough(highestBid);
        }

        refunds[highestBidder] += highestBid;

        highestBidder = msg.sender;
        highestBid = msg.value;
        emit HighestBidIncreased(highestBidder, highestBid);
    }

    function refund() external {
        uint pendingRefund = refunds[msg.sender];

        if (pendingRefund == 0) {
            revert AddressDoesNotHaveAnyRefundToReceive(msg.sender);
        }

        // https://solidity-by-example.org/sending-ether/
        // https://solidity-by-example.org/hacks/re-entrancy/
        // Forwards only 2300 gwei
        // payable(msg.sender).transfer(pendingRefund);
        // payable(msg.sender).send(pendingRefund);

        // Moving this line to a position after the call invocation
        // would introduce the security flaw which would allow
        // an attacker to exploit the contract via a re-entrant attack
        refunds[msg.sender] = 0;

        // Sends ether and forwards all gas
        (bool success, ) = payable(msg.sender).call{ value: pendingRefund }("");
        
        require(success, "Ether transfer was reverted");
    }

}
