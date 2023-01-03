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
    
            try {
                await contract.proposals(3);
                assert.fail("The try code should fail");
            } catch (e) {
                expect(e).to.be.a("Error");
            }
        });

    });

    describe("getRightToVote", () => {

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

            try {
                await contractConnectedToNonChairperson.giveRightToVote(accountTwo.address);
                assert.fail("The try code should fail");
            } catch (e) {
                expect(e).to.be.a("Error");
                expect(e.message).to.be.eq("VM Exception while processing transaction: reverted with reason string 'Only the chairperson can give right to vote'");
            }
        });

        it("should revert when voter has already voted", async () => {
            // TODO I can only implement this test once I implement the vote method
        });

        it("should revert when voter's weight is greater than 0", async () => {
            const [_, accountTwo] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await contract.giveRightToVote(accountTwo.address);

            // It should fail on the second time
            // because the weight is already 1
            try {
                await contract.giveRightToVote(accountTwo.address);
                assert.fail("The try code should fail");
            } catch (e) {
                expect(e).to.be.a("Error");
                expect(e.message).to.be.eq("Transaction reverted without a reason string");
            }
        });

    });

    describe("delegate", () => {

        it("should not allow self delegation", async () => {
            const chairperson = await ethers.getSigner();

            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            try {
                await contract.delegate(chairperson.address);
                assert.fail("The try code should fail");
            } catch (e) {
                expect(e).to.be.a("Error");
                expect(e.message).to.be.eq("VM Exception while processing transaction: reverted with reason string 'Self delegation is disallowed'");
            }
        });

        it("should not allow delegation by a non voter", async () => {
            const [_, nonVoter, randomVoter] = await ethers.getSigners();

            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            try {
                await contract.connect(nonVoter).delegate(randomVoter.address);
                assert.fail("The try code should fail");
            } catch (e) {
                expect(e).to.be.a("Error");
                expect(e.message).to.be.eq("VM Exception while processing transaction: reverted with reason string 'You have no right to vote'");
            }
        });

        it("should not allow delegation by someone who has already voted", async () => {
            // TODO Implement this test once the vote method is implemented
        });

        it("should not allow delegation loops", async () => {
            const [chairperson, voterOne, voterTwo] = await ethers.getSigners();

            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            await contract.giveRightToVote(voterOne.address);
            await contract.giveRightToVote(voterTwo.address);

            await contract.connect(voterOne).delegate(voterTwo.address);
            await contract.connect(voterTwo).delegate(chairperson.address);

            try {
                await contract.connect(chairperson).delegate(voterOne.address);
                assert.fail("The try code should fail");
            } catch (e) {
                expect(e).to.be.a("Error");
                expect(e.message).to.be.eq("VM Exception while processing transaction: reverted with reason string 'Found loop in delegation'");
            }
        });

        it("should not allow delegation to non voter", async () => {
            const [chairperson, nonVoter] = await ethers.getSigners();

            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);

            try {
                await contract.delegate(nonVoter.address);
                assert.fail("The try code should fail");
            } catch (e) {
                expect(e).to.be.a("Error");
                expect(e.message).to.be.eq("Transaction reverted without a reason string");
            }
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
            const [chairperson, voterOne, voterTwo] = await ethers.getSigners();

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

});