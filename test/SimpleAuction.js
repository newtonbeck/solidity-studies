const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

const ONE_HOUR_IN_SECONDS = 3600;

describe("SimpleAuction", () => {

    describe("deploy", () => {

        it("should define the beneficiary during deployment", async () => {
            const [_, accountTwo] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("SimpleAuction");
            const contract = await factory.deploy(ONE_HOUR_IN_SECONDS, accountTwo.address);

            const beneficiary = await contract.beneficiary();

            expect(beneficiary).to.be.eq(accountTwo.address);
        });

        it("should define the end of auction during deployment", async () => {
            const [_, accountTwo] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("SimpleAuction");
            const contract = await factory.deploy(ONE_HOUR_IN_SECONDS, accountTwo.address);

            const endTime = await contract.auctionEndTime();

            const block = await ethers.provider.getBlock(contract.deployTransaction.blockNumber);

            expect(endTime).to.be.eq(block.timestamp + ONE_HOUR_IN_SECONDS);
        });

    });

    describe("bid", () => {

        it("should revert when auction already ended", async () => {
            const [_, accountTwo] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("SimpleAuction");
            const contract = await factory.deploy(0, accountTwo.address);

            try {
                await contract.bid({
                    value: ethers.utils.parseEther("0.1")
                });
                assert.fail("Try block should fail");
            } catch (e) {
                expect(e).to.be.a("Error");
                expect(e.message).to.be.eq("VM Exception while processing transaction: reverted with custom error 'AuctionAlreadyEnded()'");
            }
        });

    });

});
