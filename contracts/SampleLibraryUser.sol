// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

library SampleLibrary {
    
    function add(uint x, uint y) internal pure returns (uint) {
        return x + y;
    }

    function map(uint[] memory xs, function (uint) internal pure returns(uint) f) internal pure returns (uint[] memory) {
        uint[] memory xs_ = new uint[](xs.length);
        for (uint i = 0; i < xs.length; i++) {
            xs_[i] = f(xs[i]);
        }
        return xs_;
    }

}

contract SampleLibraryUser {

    using SampleLibrary for *;

    constructor() {
        
    }

    function doSomething(uint x, uint y) public pure returns (uint) {
        return SampleLibrary.add(x, y);
    }

    function doubleAllNumbers(uint[] memory xs) public pure returns (uint[] memory) {
        return SampleLibrary.map(xs, double);
    }

    function double(uint x) internal pure returns (uint) {
        return x * 2;
    }

}
