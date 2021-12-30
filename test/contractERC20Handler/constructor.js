/**
 * Copyright 2020 ChainSafe Systems
 * SPDX-License-Identifier: LGPL-3.0-only
 */

const TruffleAssert = require('truffle-assertions');
const Ethers = require('ethers');

const BridgeContract = artifacts.require("Bridge");
const ERC20MintableContract = artifacts.require("ExampleToken");
const ERC20HandlerContract = artifacts.require("ERC20Handler");

const Helpers = require("../helpers");

contract('ERC20Handler - [constructor]', async () => {
    const chainID = Helpers.createChainID();

    let BridgeInstance;
    let ERC20MintableInstance1;
    let ERC20MintableInstance2;
    let ERC20MintableInstance3;
    let initialResourceIDs = [];
    let initialContractAddresses = [];
    let burnableContractAddresses = [];

    beforeEach(async () => {
        await Promise.all([
            BridgeContract.new(chainID, 0).then(instance => BridgeInstance = instance),
            ERC20MintableContract.new("token", "TOK").then(instance => ERC20MintableInstance1 = instance),
            ERC20MintableContract.new("token", "TOK").then(instance => ERC20MintableInstance2 = instance),
            ERC20MintableContract.new("token", "TOK").then(instance => ERC20MintableInstance3 = instance)
        ])

        initialResourceIDs.push(Ethers.utils.hexZeroPad((ERC20MintableInstance1.address + Ethers.utils.hexlify(chainID).substr(2)), 32));
        initialResourceIDs.push(Ethers.utils.hexZeroPad((ERC20MintableInstance2.address + Ethers.utils.hexlify(chainID).substr(2)), 32));
        initialResourceIDs.push(Ethers.utils.hexZeroPad((ERC20MintableInstance3.address + Ethers.utils.hexlify(chainID).substr(2)), 32));

        initialContractAddresses.push(ERC20MintableInstance1.address)
        initialContractAddresses.push(ERC20MintableInstance2.address)
        initialContractAddresses.push(ERC20MintableInstance3.address)
    });

    it('[sanity] contract should be deployed successfully', async () => {
        TruffleAssert.passes(await ERC20HandlerContract.new(BridgeInstance.address, initialResourceIDs, initialContractAddresses, burnableContractAddresses));
    });

    it('initialResourceIDs should be parsed correctly and corresponding resourceID mappings should have expected values', async () => {
        const ERC20HandlerInstance = await ERC20HandlerContract.new(BridgeInstance.address, initialResourceIDs, initialContractAddresses, burnableContractAddresses);

        for (let i = 0; i < initialResourceIDs.length; i++) {
            const tokenAddress = initialContractAddresses[i]
            const resourceID = initialResourceIDs[i]

            const retrievedTokenAddress = await ERC20HandlerInstance._resourceIDToTokenContractAddress.call(resourceID);
            assert.strictEqual(Ethers.utils.getAddress(tokenAddress).toLowerCase(), retrievedTokenAddress.toLowerCase());

            const retrievedResourceID = await ERC20HandlerInstance._tokenContractAddressToResourceID.call(tokenAddress);
            assert.strictEqual(resourceID.toLowerCase(), retrievedResourceID.toLowerCase());
        }
    });
});
