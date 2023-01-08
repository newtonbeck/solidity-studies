const { expect } = require("chai");
const { ethers } = require("hardhat");

const zip = (xs, ys) => xs.map((x, i) => [x, ys[i]]);

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

            const expected = [2, 4, 6].map((x) => ethers.BigNumber.from(x));

            expect(zip(result, expected)
                    .map(([x, y]) => x.eq(y))
                    .reduce((x, y) => x && y)).to.be.true;
        });

    });

});
