// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.17;

import "hardhat/console.sol";

contract Ballot {

    struct Voter {
        uint weight;
        bool voted;
        address delegate;
        uint vote;
    }

    struct Proposal {
        bytes32 name;
        uint voteCount;
    }

    address public chairperson;

    mapping(address => Voter) public voters;

    Proposal[] public proposals;

    constructor(bytes32[] memory proposalNames) {
        chairperson = msg.sender;
        voters[chairperson].weight = 1;

        for (uint i = 0; i < proposalNames.length; i++) {
            proposals.push(Proposal({
                name: proposalNames[i],
                voteCount: 0
            }));
        }
    }

    function bulkGiveRightToVote(address[] memory voters_) external {
        require(msg.sender == chairperson, "Only the chairperson can give right to vote");
        
        for (uint i = 0; i < voters_.length; i++) {
            address voter = voters_[i];
            giveRightToVoteIndividually(voter);
        }
    }

    function giveRightToVote(address voter) external {
        require(msg.sender == chairperson, "Only the chairperson can give right to vote");
        giveRightToVoteIndividually(voter);
    }

    function giveRightToVoteIndividually(address voter) internal {
        require(!voters[voter].voted, "The voter already voted");
        require(voters[voter].weight == 0);

        voters[voter].weight = 1;
    }

    function delegate(address to) external {
        require(to != msg.sender, "Self delegation is disallowed");

        Voter storage sender = voters[msg.sender];
        require(sender.weight != 0, "You have no right to vote");
        require(!sender.voted, "You already voted");

        while (voters[to].delegate != address(0)) {
            to = voters[to].delegate;
            require(to != msg.sender, "Found loop in delegation");
        }

        Voter storage delegate_ = voters[to];

        require(delegate_.weight >= 1);

        sender.voted = true;
        sender.delegate = to;

        if (delegate_.voted) {
            proposals[delegate_.vote].voteCount += sender.weight;
        } else {
            delegate_.weight += sender.weight;
        }
    }

    function vote(uint proposal) external {
        Voter storage voter = voters[msg.sender];
        require(voter.weight >= 1, "You have no right to vote");
        require(!voter.voted, "You have already voted");

        voter.voted = true;
        voter.vote = proposal;

        proposals[proposal].voteCount += voter.weight;
    }

    function winningProposals() public view returns (uint[] memory) {
        uint winningVoteCount = 0;

        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount >= winningVoteCount) {
                winningVoteCount = proposals[i].voteCount;
            }
        }

        uint winningProposalsCount = 0;
        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount == winningVoteCount) {
                winningProposalsCount++;
            }
        }

        uint[] memory winningProposals_ = new uint[](winningProposalsCount);

        uint j = 0;
        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount == winningVoteCount) {
                winningProposals_[j++] = i;
            }
        }

        return winningProposals_;
    }

    function winnersNames() external view returns (bytes32[] memory) {
        uint[] memory winners = winningProposals();

        bytes32[] memory winnersNames_ = new bytes32[](winners.length);

        for (uint i = 0; i < winners.length; i++) {
            winnersNames_[i] = proposals[winners[i]].name;
        }

        return winnersNames_;
    }
}