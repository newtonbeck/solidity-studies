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

            await expect(
                contract.bid({ value: ethers.utils.parseEther("0.1") })
            ).to.be.revertedWithCustomError(contract, "AuctionAlreadyEnded");
        });

        it("should revert when bid is lower than highest bid", async () => {
            const [_, accountTwo, accountThree] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("SimpleAuction");
            const contract = await factory.deploy(ONE_HOUR_IN_SECONDS, accountTwo.address);

            await contract.connect(accountTwo).bid({
                value: ethers.utils.parseEther("0.2")
            });

            await expect(
                contract
                    .connect(accountThree)
                    .bid({ value: ethers.utils.parseEther("0.1") })
            ).to.be.revertedWithCustomError(contract, "BidNotHighEnough");
        });

        it("should change highest bidder when a higher bid is sent", async () => {
            const [beneficiary, accountOne, accountTwo] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("SimpleAuction");
            const contract = await factory.deploy(ONE_HOUR_IN_SECONDS, beneficiary.address);

            await contract.connect(accountOne).bid({ value: ethers.utils.parseEther("0.1") });
            await contract.connect(accountTwo).bid({ value: ethers.utils.parseEther("0.2") });

            const highestBidder = await contract.highestBidder();

            expect(highestBidder).to.be.eq(accountTwo.address);
        });

        it("should change highest bid when a higher bid is sent", async () => {
            const [beneficiary, accountOne, accountTwo] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("SimpleAuction");
            const contract = await factory.deploy(ONE_HOUR_IN_SECONDS, beneficiary.address);

            await contract.connect(accountOne).bid({ value: ethers.utils.parseEther("0.1") });
            await contract.connect(accountTwo).bid({ value: ethers.utils.parseEther("0.2") });

            const highestBid = await contract.highestBid();

            expect(highestBid).to.be.eq(ethers.utils.parseEther("0.2"));
        });

        it("should emit HighestBidIncreased event when a higher bid is sent", async () => {
            const [beneficiary, accountOne, accountTwo] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("SimpleAuction");
            const contract = await factory.deploy(ONE_HOUR_IN_SECONDS, beneficiary.address);

            await contract.connect(accountOne).bid({ value: ethers.utils.parseEther("0.1") });

            await expect(
                contract
                    .connect(accountTwo)
                    .bid({ value: ethers.utils.parseEther("0.2") })
            ).to.emit(contract, "HighestBidIncreased").withArgs(
                accountTwo.address,
                ethers.utils.parseEther("0.2")
            );
        });

        it("should increase contract's balance by msg.value", async () => {
            const [beneficiary, accountOne, accountTwo] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("SimpleAuction");
            const contract = await factory.deploy(ONE_HOUR_IN_SECONDS, beneficiary.address);

            await contract.connect(accountOne).bid({ value: ethers.utils.parseEther("0.1") });
            await contract.connect(accountTwo).bid({ value: ethers.utils.parseEther("0.2") });

            const contractBalance = await ethers.provider.getBalance(contract.address);

            expect(contractBalance).to.be.eq(
                ethers.utils.parseEther("0.30")
            );
        });

        it("should add previous highest bidder to a refunds list", async () => {
            const [beneficiary, accountOne, accountTwo] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("SimpleAuction");
            const contract = await factory.deploy(ONE_HOUR_IN_SECONDS, beneficiary.address);

            await contract.connect(accountOne).bid({ value: ethers.utils.parseEther("0.1") });
            await contract.connect(accountTwo).bid({ value: ethers.utils.parseEther("0.2") });

            const accountOneRefundValue = await contract.refunds(accountOne.address);

            expect(accountOneRefundValue).to.be.eq(ethers.utils.parseEther("0.1"));
        });

        it("should accumululate previous highest bidder's refunds", async () => {
            const [beneficiary, accountOne, accountTwo] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("SimpleAuction");
            const contract = await factory.deploy(ONE_HOUR_IN_SECONDS, beneficiary.address);

            await contract.connect(accountOne).bid({ value: ethers.utils.parseEther("0.1") });
            await contract.connect(accountTwo).bid({ value: ethers.utils.parseEther("0.2") });
            await contract.connect(accountOne).bid({ value: ethers.utils.parseEther("0.3") });
            await contract.connect(accountTwo).bid({ value: ethers.utils.parseEther("0.4") });

            const accountOneRefundValue = await contract.refunds(accountOne.address);
            const accountTwoRefundValue = await contract.refunds(accountTwo.address);

            expect(accountOneRefundValue).to.be.eq(ethers.utils.parseEther("0.4"));
            expect(accountTwoRefundValue).to.be.eq(ethers.utils.parseEther("0.2"));
        });

    });

    describe("refund", () => {

        it("should revert when address does not have any refunds to receive", async () => {
            const [beneficiary, accountOne, accountTwo] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("SimpleAuction");
            const contract = await factory.deploy(ONE_HOUR_IN_SECONDS, beneficiary.address);

            await expect(contract.connect(accountOne).refund()).to.be
                .revertedWithCustomError(contract, "AddressDoesNotHaveAnyRefundToReceive")
                .withArgs(accountOne.address);
        });

        it("should transfer pending refunds to address", async () => {
            const [beneficiary, accountOne, accountTwo] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("SimpleAuction");
            const contract = await factory.deploy(ONE_HOUR_IN_SECONDS, beneficiary.address);

            await contract.connect(accountOne).bid({ value: ethers.utils.parseEther("0.1") });
            await contract.connect(accountTwo).bid({ value: ethers.utils.parseEther("0.2") });

            const contractsBalanceBeforeRefundingAccountOne = await ethers.provider.getBalance(contract.address);

            await contract.connect(accountOne).refund();

            const contractsBalanceAfterRefundingAccountOne = await ethers.provider.getBalance(contract.address);

            await expect(contractsBalanceAfterRefundingAccountOne).to.be.eq(
                contractsBalanceBeforeRefundingAccountOne.sub(ethers.utils.parseEther("0.1"))
            );
            
            // TODO how to test that the address received the right amount of ethers?
        });

        it("should not allow re-entrant attacks", async () => {
            const [beneficiary, attacker, accountTwo] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("SimpleAuction");
            const contract = await factory.deploy(ONE_HOUR_IN_SECONDS, beneficiary.address);

            const attackerFactory = await ethers.getContractFactory("SimpleAuctionReEntrantAttacker");
            const attackerContract = await attackerFactory.deploy();

            await attackerContract.connect(attacker).bid(
                contract.address,
                { value: ethers.utils.parseEther("0.1") }
            );
            await contract.connect(accountTwo).bid({ value: ethers.utils.parseEther("0.2") });

            expect(await ethers.provider.getBalance(contract.address)).to.be.eq(ethers.utils.parseEther("0.3"));

            // Perform the attack, which should fail
            await expect(
                attackerContract.connect(attacker).refund(contract.address)
            ).to.be.revertedWith("Ether transfer was reverted");

            // Should revert the transaction and keep the balance as it was in the beginning
            expect(await ethers.provider.getBalance(contract.address)).to.be.eq(ethers.utils.parseEther("0.3"));
        });

    });

    describe("auctionEnd", () => {

        it("should not end an auction before its end time", async () => {
            const [beneficiary] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("SimpleAuction");
            const contract = await factory.deploy(ONE_HOUR_IN_SECONDS, beneficiary.address);

            await expect(contract.auctionEnd()).to.be.revertedWithCustomError(
                contract,
                "AuctionNotYetEnded"
            );
        });

        it("should not end an auction already ended", async () => {
            const [beneficiary] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("SimpleAuction");
            const contract = await factory.deploy(0, beneficiary.address);

            await contract.auctionEnd();

            await expect(contract.auctionEnd()).to.be.revertedWithCustomError(
                contract,
                "AuctionEndAlreadyCalled"
            );
        });

        it("should transfer highest bid from contract to beneficiary", async () => {
            const [beneficiary, accountOne] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("SimpleAuction");
            // This test has a high potential to be flaky
            const contract = await factory.deploy(1, beneficiary.address);

            await contract.connect(accountOne).bid({ value: ethers.utils.parseEther("0.1") });

            await expect(contract.auctionEnd()).to
                .emit(contract, "AuctionEnded")
                .withArgs(accountOne.address, ethers.utils.parseEther("0.1"));
        });

        it("should transfer highest bid from contract to beneficiary", async () => {
            const [beneficiary, accountOne, accountTwo] = await ethers.getSigners();
            
            const factory = await ethers.getContractFactory("SimpleAuction");
            // This test has a high potential to be flaky
            const contract = await factory.deploy(2, beneficiary.address);

            await contract.connect(accountOne).bid({ value: ethers.utils.parseEther("0.1") });
            await contract.connect(accountTwo).bid({ value: ethers.utils.parseEther("0.2") });

            expect(await ethers.provider.getBalance(contract.address)).to.be.eq(ethers.utils.parseEther("0.3"));

            await contract.auctionEnd();

            expect(await ethers.provider.getBalance(contract.address)).to.be.eq(ethers.utils.parseEther("0.1"));
        });

    });

});
