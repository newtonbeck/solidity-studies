const { expect } = require("chai");
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
            const signer = await ethers.getSigner();
    
            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);
    
            const chairperson = await contract.chairperson();
            const voter = await contract.voters(chairperson);
    
            expect(voter.weight).to.be.eq(1)
        });

        it("should set the vote proposals", async () => {
            const signer = await ethers.getSigner();
    
            const factory = await ethers.getContractFactory("Ballot");
            const contract = await factory.deploy([BLUE_PROPOSAL, RED_PROPOSAL, GREEN_PROPOSAL]);
    
            const firstProposal = await contract.proposals(0);
            const secondProposal = await contract.proposals(1);
            const thirdProposal = await contract.proposals(2);
    
            expect(firstProposal.name).to.be.eq(BLUE_PROPOSAL);
            expect(secondProposal.name).to.be.eq(RED_PROPOSAL);
            expect(thirdProposal.name).to.be.eq(GREEN_PROPOSAL);
        });

    })

});