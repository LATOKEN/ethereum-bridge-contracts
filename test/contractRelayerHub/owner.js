/**
 * SPDX-License-Identifier: LGPL-3.0-only
 */
const TruffleAssert = require('truffle-assertions');
const Ethers = require('ethers');

const Helpers = require('../helpers');

const BridgeContract = artifacts.require("Bridge");
const RelayerHubContract = artifacts.require("RelayerHub");

contract('RelayerHub - [owner]', async accounts => {
  const chainID = Ethers.utils.hexlify(Ethers.utils.randomBytes(8));

  let AdminAddress = accounts[0];
  let RelayerAddress = accounts[1];
  let PenaltyPercent = 10;
  let RewardPercent = 10;

  let BridgeInstance;
  let RelayerHubInstance;

  beforeEach(async () => {
    BridgeInstance = await BridgeContract.new(chainID, 0);
    RelayerHubInstance = await RelayerHubContract.new(BridgeInstance.address, PenaltyPercent, RewardPercent);
  });

  it("[sanity] only admin should register relayer", async () => {
    TruffleAssert.passes(await RelayerHubInstance.register(RelayerAddress, { from: AdminAddress }))
    const relayerExist = await RelayerHubInstance._relayersExistMap.call(RelayerAddress)
    assert.strictEqual(relayerExist, true);
    assert.strictEqual(await RelayerHubInstance.isRelayer(RelayerAddress), true)
  })

  it("should not register existing relayer", async () => {
    TruffleAssert.passes(await RelayerHubInstance.register(RelayerAddress, { from: AdminAddress }))
    TruffleAssert.reverts(RelayerHubInstance.register(RelayerAddress, { from: AdminAddress }), "relayer already exist")
  })

  it("should revert if non-admin registers relayer", async () => {
    TruffleAssert.reverts(RelayerHubInstance.register(RelayerAddress, { from: accounts[3] }), "Ownable: caller is not the owner")
  })

  it("[sanity] only admin should unregister relayer", async () => {
    TruffleAssert.passes(await RelayerHubInstance.register(RelayerAddress, { from: AdminAddress }))
    assert.strictEqual(await RelayerHubInstance.isRelayer(RelayerAddress), true)
    TruffleAssert.passes(await RelayerHubInstance.unregister(RelayerAddress, { from: AdminAddress }))
  })

  it("[sanity] RelayerUnRegister event is emitted after register is called by owner", async () => {
    TruffleAssert.passes(await RelayerHubInstance.register(RelayerAddress, { from: AdminAddress }))
    let tx = await RelayerHubInstance.unregister(RelayerAddress, { from: AdminAddress })
    TruffleAssert.eventEmitted(tx, "RelayerUnRegister", ev => {
      return ev._relayer == RelayerAddress
    })
  })

  it("should revert if non-owner unregisters relayer", async () => {
    TruffleAssert.passes(await RelayerHubInstance.register(RelayerAddress, { from: AdminAddress }))
    TruffleAssert.reverts(RelayerHubInstance.unregister(RelayerAddress, { from: accounts[3] }), "Ownable: caller is not the owner")
  })

  it("[sanity] only admin should block relayer", async () => {
    TruffleAssert.passes(await RelayerHubInstance.register(RelayerAddress, { from: AdminAddress }))
    assert.strictEqual(await RelayerHubInstance.isRelayer(RelayerAddress), true)
    TruffleAssert.passes(await RelayerHubInstance.felony(RelayerAddress, { from: AdminAddress }))
    assert.strictEqual(await RelayerHubInstance._relayerBlocked.call(RelayerAddress), true)
  })

  it("[sanity] only admin should update penalty and reward percentage which emits event", async () => {
    let updateRewardPercentagetx = await RelayerHubInstance.updateRewardPercentage(0, { from: AdminAddress })
    let updatedRewardPercent = await RelayerHubInstance._rewardPercentage.call()
    TruffleAssert.eventEmitted(updateRewardPercentagetx, "RewardPercentageChanged", (ev) => {
      return ev.newPercentage == 0
    })
    assert.strictEqual(updatedRewardPercent.toNumber(), 0)

    let updatePenaltyPercentageTx = await RelayerHubInstance.updatePenaltyPercentage(0, { from: AdminAddress })
    TruffleAssert.eventEmitted(updatePenaltyPercentageTx, "PenaltyPercentChanged", (ev) => {
      return ev.newPercentage == 0
    })
    let updatedPenaltyPercent = await RelayerHubInstance._penaltyPercentage.call()
    assert.strictEqual(updatedPenaltyPercent.toNumber(), 0)
  })

  it("[sanity] emits event relayerRegister when relayer is registered", async () => {
    let tx = await RelayerHubInstance.register(RelayerAddress, { from: AdminAddress })
    TruffleAssert.eventEmitted(tx, "RelayerRegister", {
      _relayer: RelayerAddress
    })
  })
})