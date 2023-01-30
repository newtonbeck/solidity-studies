const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("Ballot", () => {

    const BLUE_PROPOSAL = ethers.utils.formatBytes32String("Blue");
    const RED_PROPOSAL = ethers.utils.formatBytes32String("Red");
    const GREEN_PROPOSAL = ethers.utils.formatBytes32String("Green");

    describe("Deployment", () => {

        it("should set the contract creator as the chairperson", async () => {
            const signer = await ethers.getSigner();
    
            const factory = await ethers.getContractFactory("Ballot");
            
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);
    
            const chairperson = await contract.chairperson();
    
            expect(signer.address).to.be.eq(chairperson)
        });

        it("should set the chairperson's vote weight as 1", async () => {
            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);
    
            const chairperson = await contract.chairperson();
            const voter = await contract.voters(chairperson);
    
            expect(voter.weight).to.be.eq(1)
        });

        it("should set the vote proposals", async () => {
            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);
    
            const firstProposal = await contract.proposals(0);
            const secondProposal = await contract.proposals(1);
            const thirdProposal = await contract.proposals(2);
    
            expect(firstProposal.name).to.be.eq(BLUE_PROPOSAL);
            expect(secondProposal.name).to.be.eq(RED_PROPOSAL);
            expect(thirdProposal.name).to.be.eq(GREEN_PROPOSAL);
        });

        it("should not set a proposal that was not informed during contract deployment", async () => {
            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await expect(contract.proposals(3)).to.be.revertedWithoutReason();
        });

    });

    describe("giveRightToVote", () => {

        it("should update the voter weight from 0 to 1", async () => {
            const [_, accountTwo] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            const voterBeforeRight = await contract.voters(accountTwo.address);
            expect(voterBeforeRight.weight).to.be.eq(0);

            await contract.giveRightToVote(accountTwo.address);

            const voterAfterRight = await contract.voters(accountTwo.address);
            expect(voterAfterRight.weight).to.be.eq(1);
        });

        it("should revert when accessed by someone other than chairperson", async () => {
            const [_, accountTwo] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            const contractConnectedToNonChairperson = contract.connect(accountTwo);

            await expect(
                contractConnectedToNonChairperson.giveRightToVote(accountTwo.address)
            ).to.be.revertedWith("Only the chairperson can give right to vote");
        });

        it("should revert when voter has already voted", async () => {
            const [_, voter] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await contract.giveRightToVote(voter.address);
            await contract.connect(voter).vote(1);

            await expect(
                contract.giveRightToVote(voter.address)
            ).to.be.revertedWith("The voter already voted");
        });

        it("should revert when voter's weight is greater than 0", async () => {
            const [_, accountTwo] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await contract.giveRightToVote(accountTwo.address);

            await expect(
                contract.giveRightToVote(accountTwo.address)
            ).to.be.revertedWithoutReason();
        });

    });

    describe("bulkGiveRightToVote", () => {

        it("should update the voters weight from 0 to 1", async () => {
            const [_, accountTwo, accountThree] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            const voterTwoBeforeRight = await contract.voters(accountTwo.address);
            expect(voterTwoBeforeRight.weight).to.be.eq(0);

            const voterThreeBeforeRight = await contract.voters(accountThree.address);
            expect(voterThreeBeforeRight.weight).to.be.eq(0);

            await contract.bulkGiveRightToVote([accountTwo.address, accountThree.address]);

            const voterTwoAfterRight = await contract.voters(accountTwo.address);
            expect(voterTwoAfterRight.weight).to.be.eq(1);

            const voterThreeAfterRight = await contract.voters(accountThree.address);
            expect(voterThreeAfterRight.weight).to.be.eq(1);
        });

        it("should revert when accessed by someone other than chairperson", async () => {
            const [_, accountTwo, accountThree] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            const contractConnectedToNonChairperson = contract.connect(accountTwo);

            await expect(
                contractConnectedToNonChairperson.bulkGiveRightToVote([accountTwo.address, accountThree.address])
            ).to.be.revertedWith("Only the chairperson can give right to vote");
        });

        it("should revert when at least one voter has already voted", async () => {
            const [_, voterOne, voterTwo] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await contract.giveRightToVote(voterOne.address);
            await contract.connect(voterOne).vote(1);

            await expect(
                contract.bulkGiveRightToVote([voterOne.address, voterTwo.address])
            ).to.be.revertedWith("The voter already voted");
        });

        it("should revert when at least one voter's weight is greater than 0", async () => {
            const [_, accountTwo, accountThree] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await contract.giveRightToVote(accountTwo.address);

            await expect(
                contract.bulkGiveRightToVote([accountTwo.address, accountThree.address])
            ).to.be.revertedWithoutReason();
        });

    });

    describe("delegate", () => {

        it("should not allow self delegation", async () => {
            const chairperson = await ethers.getSigner();

            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await expect(
                contract.delegate(chairperson.address)
            ).to.be.revertedWith("Self delegation is disallowed");
        });

        it("should not allow delegation by a non voter", async () => {
            const [_, nonVoter, randomVoter] = await ethers.getSigners();

            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await expect(
                contract.connect(nonVoter).delegate(randomVoter.address)
            ).to.be.revertedWith("You have no right to vote");
        });

        it("should not allow delegation by someone who has already voted", async () => {
            const [_, voterOne, voterTwo] = await ethers.getSigners();

            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await contract.giveRightToVote(voterOne.address);
            await contract.giveRightToVote(voterTwo.address);

            await contract.connect(voterOne).vote(1);

            await expect(
                contract.connect(voterOne).delegate(voterTwo.address)
            ).to.be.revertedWith("You already voted");
        });

        it("should not allow delegation loops", async () => {
            const [chairperson, voterOne, voterTwo] = await ethers.getSigners();

            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await contract.giveRightToVote(voterOne.address);
            await contract.giveRightToVote(voterTwo.address);

            await contract.connect(voterOne).delegate(voterTwo.address);
            await contract.connect(voterTwo).delegate(chairperson.address);

            await expect(
                contract.connect(chairperson).delegate(voterOne.address)
            ).to.be.revertedWith("Found loop in delegation");
        });

        it("should not allow delegation to non voter", async () => {
            const [_, nonVoter] = await ethers.getSigners();

            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await expect(
                contract.delegate(nonVoter.address)
            ).to.be.revertedWithoutReason();
        });

        it("should delegate vote to another voter", async () => {
            const [chairperson, voter] = await ethers.getSigners();

            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await contract.giveRightToVote(voter.address);
            await contract.delegate(voter.address);

            const chairpersonAfterDelegation = await contract.voters(chairperson.address);
            const voterAfterDelegation = await contract.voters(voter.address);

            expect(chairpersonAfterDelegation.weight).to.be.eq(1);
            expect(chairpersonAfterDelegation.voted).to.be.true;
            expect(chairpersonAfterDelegation.delegate).to.be.eq(voter.address);

            expect(voterAfterDelegation.weight).to.be.eq(2);
            expect(voterAfterDelegation.voted).to.be.false;
            expect(voterAfterDelegation.delegate).to.be.eq("0x0000000000000000000000000000000000000000");
        });

        it("should accumulate delegations", async () => {
            const [_, voterOne, voterTwo] = await ethers.getSigners();

            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await contract.giveRightToVote(voterOne.address);
            await contract.giveRightToVote(voterTwo.address);
            
            await contract.delegate(voterOne.address);
            await contract.connect(voterOne).delegate(voterTwo.address);

            const voterTwoAfterDelegation = await contract.voters(voterTwo.address);

            expect(voterTwoAfterDelegation.weight).to.be.eq(3);
            expect(voterTwoAfterDelegation.voted).to.be.false;
            expect(voterTwoAfterDelegation.delegate).to.be.eq("0x0000000000000000000000000000000000000000");
        });

    });

    describe("vote", () => {

        it("should not allow a non voter to vote", async () => {
            const [_, nonVoter] = await ethers.getSigners();

            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await expect(
                contract.connect(nonVoter).vote(1)
            ).to.be.revertedWith("You have no right to vote");
        });

        it("should not allow voting twice", async () => {
            const [_, voter] = await ethers.getSigners();

            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await contract.giveRightToVote(voter.address);

            await contract.connect(voter).vote(1);

            await expect(
                contract.connect(voter).vote(1)
            ).to.be.revertedWith("You have already voted");
        });

        it("should allow a voter to vote", async () => {
            const [_, voter] = await ethers.getSigners();

            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await contract.giveRightToVote(voter.address);

            const votedProposalIndex = 1;

            await contract.connect(voter).vote(votedProposalIndex);

            const voterAfterVoting = await contract.voters(voter.address);
            const votedProposal = await contract.proposals(votedProposalIndex);

            expect(voterAfterVoting.voted).to.be.true;
            expect(voterAfterVoting.vote).to.be.eq(votedProposalIndex);
            expect(votedProposal.voteCount).to.be.eq(1);
        });

        it("should allow delegated voting", async () => {
            const [_, voterOne, voterTwo] = await ethers.getSigners();

            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await contract.giveRightToVote(voterOne.address);
            await contract.giveRightToVote(voterTwo.address);

            await contract.connect(voterOne).delegate(voterTwo.address);

            const votedProposalIndex = 1;

            await contract.connect(voterTwo).vote(votedProposalIndex);

            const voterTwoAfterVoting = await contract.voters(voterTwo.address);
            const votedProposal = await contract.proposals(votedProposalIndex);

            expect(voterTwoAfterVoting.voted).to.be.true;
            expect(voterTwoAfterVoting.vote).to.be.eq(votedProposalIndex);
            expect(votedProposal.voteCount).to.be.eq(2);
        });

    });

    describe("winningProposals", () => {

        it("return the winning proposal", async () => {
            const [_, voterOne, voterTwo, voterThree, voterFour] = await ethers.getSigners();

            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await contract.giveRightToVote(voterOne.address);
            await contract.giveRightToVote(voterTwo.address);
            await contract.giveRightToVote(voterThree.address);
            await contract.giveRightToVote(voterFour.address);

            await contract.connect(voterOne).vote(0);
            await contract.connect(voterTwo).vote(1);
            await contract.connect(voterThree).vote(2);
            await contract.connect(voterFour).vote(1);

            const winningProposals = await contract.winningProposals();

            expect(winningProposals.length).to.be.eq(1);
            expect(winningProposals[0]).to.be.eq(1);
        });

        it("returns two winning proposals when there is a tie", async () => {
            const [_, voterOne, voterTwo, voterThree, voterFour, voterFive] = await ethers.getSigners();

            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await contract.giveRightToVote(voterOne.address);
            await contract.giveRightToVote(voterTwo.address);
            await contract.giveRightToVote(voterThree.address);
            await contract.giveRightToVote(voterFour.address);
            await contract.giveRightToVote(voterFive.address);

            await contract.connect(voterOne).vote(0);
            await contract.connect(voterTwo).vote(1);
            await contract.connect(voterThree).vote(2);
            await contract.connect(voterFour).vote(1);
            await contract.connect(voterFive).vote(2);

            const winningProposals = await contract.winningProposals();

            expect(winningProposals.length).to.be.eq(2);
            expect(winningProposals[0]).to.be.eq(1);
            expect(winningProposals[1]).to.be.eq(2);
        });

    });

    describe("winnersNames", () => {

        it("return the winner name", async () => {
            const [_, voterOne, voterTwo, voterThree, voterFour] = await ethers.getSigners();

            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await contract.giveRightToVote(voterOne.address);
            await contract.giveRightToVote(voterTwo.address);
            await contract.giveRightToVote(voterThree.address);
            await contract.giveRightToVote(voterFour.address);

            await contract.connect(voterOne).vote(0);
            await contract.connect(voterTwo).vote(1);
            await contract.connect(voterThree).vote(2);
            await contract.connect(voterFour).vote(1);

            const winningProposals = await contract.winnersNames();

            expect(winningProposals.length).to.be.eq(1);
            expect(winningProposals[0]).to.be.eq(RED_PROPOSAL);
        });

        it("returns two winning names when there is a tie", async () => {
            const [_, voterOne, voterTwo, voterThree, voterFour, voterFive] = await ethers.getSigners();

            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await contract.giveRightToVote(voterOne.address);
            await contract.giveRightToVote(voterTwo.address);
            await contract.giveRightToVote(voterThree.address);
            await contract.giveRightToVote(voterFour.address);
            await contract.giveRightToVote(voterFive.address);

            await contract.connect(voterOne).vote(0);
            await contract.connect(voterTwo).vote(1);
            await contract.connect(voterThree).vote(2);
            await contract.connect(voterFour).vote(1);
            await contract.connect(voterFive).vote(2);

            const winningProposals = await contract.winnersNames();

            expect(winningProposals.length).to.be.eq(2);
            expect(winningProposals[0]).to.be.eq(RED_PROPOSAL);
            expect(winningProposals[1]).to.be.eq(GREEN_PROPOSAL);
        });

    });

});