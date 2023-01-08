const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SampleLibraryUser", () => {

    describe("doSomething", () => {

        it("should add two numbers", async () => {
            const factory = await ethers.getContractFactory("SampleLibraryUser");
            const contract = await factory.deploy();

            const result = await contract.doSomething(2, 3);

            expect(result).to.be.eq(5);
        });

    });

    describe("doubleAllNumbers", () => {

        it("should double all numbers in the array", async() => {
            const factory = await ethers.getContractFactory("SampleLibraryUser");
            const contract = await factory.deploy();

            const result = await contract.doubleAllNumbers([1,2,3]);

            expect(result[0]).to.be.eq(2);
            expect(result[1]).to.be.eq(4);
            expect(result[2]).to.be.eq(6);
        });

    });

});
