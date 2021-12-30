/**
 * SPDX-License-Identifier: LGPL-3.0-only
 */
const TruffleAssert = require('truffle-assertions');
const Ethers = require('ethers');

const Helpers = require('../helpers');

const BridgeContract = artifacts.require("Bridge");
const RelayerHubContract = artifacts.require("RelayerHub");

contract('RelayerHub - [bridge]', async accounts => {
  const chainID = Ethers.utils.hexlify(Ethers.utils.randomBytes(8));

  let AdminAddress = accounts[0];
  let RelayerAddress = accounts[1];
  let PenaltyPercent = 10;
  let RewardPercent = 10;

  let swapAmount = 1000;
  let expectedPenaltyAndReward = 100;

  let BridgeAddress = accounts[2];
  let RelayerHubInstance;

  beforeEach(async () => {
    RelayerHubInstance = await RelayerHubContract.new(BridgeAddress, PenaltyPercent, RewardPercent);
    await RelayerHubInstance.register(RelayerAddress, { from: AdminAddress })
  });

  it("[sanity] only Bridge should call alreadyExecuted method", async () => {
    TruffleAssert.passes(await RelayerHubInstance.alreadyExecuted(RelayerAddress, swapAmount, { from: BridgeAddress }))
  })

  it("should fail when non Bridge call alreadyExecuted method", async () => {
    TruffleAssert.fails(RelayerHubInstance.alreadyExecuted(RelayerAddress, swapAmount, { from: accounts[3] }), "sender must be bridge contract")
  })

  it("[sanity] alreadyExecuted method should emit PenaltyForRelayer", async () => {
    let tx = await RelayerHubInstance.alreadyExecuted(RelayerAddress, swapAmount, { from: BridgeAddress })
    TruffleAssert.eventEmitted(tx, "PenaltyForRelayer", ev => {
      return (ev.reason == "proposal already executed" &&
        ev.relayer == RelayerAddress &&
        ev.penalty == expectedPenaltyAndReward
      )
    })
  })

  it("[sanity] only Bridge should call swapReward method", async () => {
    TruffleAssert.passes(await RelayerHubInstance.swapReward(RelayerAddress, swapAmount, { from: BridgeAddress }))
  })

  it("should fail when non Bridge call swapReward method", async () => {
    TruffleAssert.fails(RelayerHubInstance.swapReward(RelayerAddress, swapAmount, { from: accounts[3] }), "sender must be bridge contract")
  })

  it("[sanity] swapReward method should emit RewardForRelayer", async () => {
    let tx = await RelayerHubInstance.swapReward(RelayerAddress, swapAmount, { from: BridgeAddress })
    TruffleAssert.eventEmitted(tx, "RewardForRelayer", ev => {
      return (
        ev.relayer == RelayerAddress &&
        ev.reward == expectedPenaltyAndReward
      )
    })
  })
})