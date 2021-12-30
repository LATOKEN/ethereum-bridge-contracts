/**
 * Copyright 2020 ChainSafe Systems
 * SPDX-License-Identifier: LGPL-3.0-only
 */

const TruffleAssert = require('truffle-assertions');
const Ethers = require('ethers');

const Helpers = require('../helpers');

const BridgeContract = artifacts.require("Bridge");
const ERC20MintableContract = artifacts.require("ExampleToken");
const ERC20HandlerContract = artifacts.require("ERC20Handler");

contract('Bridge - [fee]', async (accounts) => {
    const originChainID = Helpers.createChainID();
    const destinationChainID = Helpers.createChainID();
    const admin = accounts[0];
    const depositerAddress = accounts[1];
    const recipientAddress = accounts[2];
    const originChainInitialTokenAmount = 100;
    const depositAmount = 10;

    let BridgeInstance;
    let OriginERC20MintableInstance;
    let OriginERC20HandlerInstance;
    let resourceID;
    let initialResourceIDs;
    let initialContractAddresses;

    beforeEach(async () => {
        await Promise.all([
            ERC20MintableContract.new("token", "TOK").then(instance => OriginERC20MintableInstance = instance),
            BridgeInstance = BridgeContract.new(originChainID, 0).then(instance => BridgeInstance = instance)
        ]);

        resourceID = Helpers.createResourceID(OriginERC20MintableInstance.address, originChainID);
        initialResourceIDs = [];
        initialContractAddresses = [];
        burnableContractAddresses = [];

        OriginERC20HandlerInstance = await ERC20HandlerContract.new(BridgeInstance.address, initialResourceIDs, initialContractAddresses, burnableContractAddresses);

        await Promise.all([
            BridgeInstance.adminSetResource(OriginERC20HandlerInstance.address, resourceID, OriginERC20MintableInstance.address),
            OriginERC20MintableInstance.mint(depositerAddress, originChainInitialTokenAmount)
        ]);
        await OriginERC20MintableInstance.approve(OriginERC20HandlerInstance.address, depositAmount * 2, { from: depositerAddress });

    });

    it('[sanity] deposit can be made', async () => {
        await TruffleAssert.passes(BridgeInstance.deposit(
            destinationChainID,
            resourceID,
            depositAmount, recipientAddress,
            { from: depositerAddress, value: 0 }
        ));
    });

    it('deposit reverts if invalid amount supplied', async () => {
        // current fee is set to 0
        assert.equal(await BridgeInstance._fee.call(), 0)

        await TruffleAssert.reverts(
            BridgeInstance.deposit(
                destinationChainID,
                resourceID,
                depositAmount, recipientAddress,
                { from: depositerAddress, value: 10 }
            )
        )
    });

    it('deposit passes if valid amount supplied', async () => {
        // current fee is set to 0
        assert.equal(await BridgeInstance._fee.call(), 0)
        // Change fee to 0.5 ether
        await BridgeInstance.adminChangeFee(Ethers.utils.parseEther("0.5"), { from: admin })
        assert.equal(web3.utils.fromWei((await BridgeInstance._fee.call()), "ether"), "0.5");

        await TruffleAssert.passes(
            BridgeInstance.deposit(
                destinationChainID,
                resourceID,
                depositAmount, recipientAddress,
                {
                    value: Ethers.utils.parseEther("0.5"),
                    from: depositerAddress
                }
            )
        )
    });
})