/**
 * SPDX-License-Identifier: LGPL-3.0-only
 */
const TruffleAssert = require('truffle-assertions');
const Ethers = require('ethers');

const Helpers = require('../helpers');

const ERC20HandlerContract = artifacts.require("ERC20Handler");
const ERC20MintableContract = artifacts.require("ExampleToken");
const BridgeContract = artifacts.require("Bridge");
const RelayerHubContract = artifacts.require("RelayerHub");

contract('Bridge - [relayers]', async accounts => {
  const chainID = Ethers.utils.hexlify(Ethers.utils.randomBytes(8));
  let depositNonce = 1;
  let penaltyPercent = 10;
  let rewardPercent = 10;
  let amount = 100;

  let AdminAddress = accounts[0];
  let RelayerAddress = accounts[1];
  let RecipientAddress = accounts[2];

  let BridgeInstance;
  let RelayerHubInstance;
  let OriginERC20MintableInstance;
  let HandlerInstance;
  let resourceID;

  beforeEach(async () => {
    BridgeInstance = await BridgeContract.new(chainID, 0);
    RelayerHubInstance = await RelayerHubContract.new(BridgeInstance.address, penaltyPercent, rewardPercent);
    OriginERC20MintableInstance = await ERC20MintableContract.new("token", "TOK");
    HandlerInstance = await ERC20HandlerContract.new(BridgeInstance.address, [], [], []);

    resourceID = Helpers.createResourceID(OriginERC20MintableInstance.address, chainID)

    BridgeInstance.adminSetResource(HandlerInstance.address, resourceID, OriginERC20MintableInstance.address),

    await OriginERC20MintableInstance.mint(HandlerInstance.address, amount)
    await RelayerHubInstance.register(RelayerAddress, { from: AdminAddress })
    await BridgeInstance.adminSetRelayerHub(RelayerHubInstance.address, { from: AdminAddress })
  });

  it("check handler contract balance", async () => {
    let handlerBalance = await OriginERC20MintableInstance.balanceOf(HandlerInstance.address)
    assert.strictEqual(handlerBalance.toNumber(), amount)
  })

  it("[sanity] only relayer should call executeProposal method", async () => {
    TruffleAssert.passes(await BridgeInstance.executeProposal(chainID, depositNonce, resourceID, RecipientAddress, amount, { from: RelayerAddress }))
  })

  it("should fail when non relayer calls executeProposal method", async () => {
    TruffleAssert.fails(BridgeInstance.executeProposal(chainID, depositNonce, resourceID, RecipientAddress, amount, { from: accounts[4] }), "sender is not a relayer")
  })

  it("should revert if resourceID is not mapped to any handler address", async () => {
    let newResourceID = Helpers.createResourceID(HandlerInstance.address, chainID);
    TruffleAssert.fails(BridgeInstance.executeProposal(chainID, depositNonce, newResourceID, RecipientAddress, amount, { from: RelayerAddress }), "resourceID not mapped to handler")
  })

  it("[sanity] should emit ProposalEvent with proposalStatus as Executed", async () => {
    let tx = await BridgeInstance.executeProposal(chainID, depositNonce, resourceID, RecipientAddress, amount, { from: RelayerAddress })
    TruffleAssert.eventEmitted(tx, "ProposalEvent", ev => {
      return (
        ev.originChainID.substr(0, 18) == chainID.toLowerCase() &&
        ev.depositNonce == depositNonce &&
        ev.status.toString() == 3 &&
        ev.resourceID == resourceID.toLowerCase() &&
        ev.dataHash === Helpers.createDataHash(amount, RecipientAddress, HandlerInstance.address)
      )
    })
  })

  it("[sanity] should not emit ProposalEvent when relayer executes proposal twice", async () => {
    await BridgeInstance.executeProposal(chainID, depositNonce, resourceID, RecipientAddress, amount, { from: RelayerAddress })
    let tx= await BridgeInstance.executeProposal(chainID, depositNonce, resourceID, RecipientAddress, amount, { from: RelayerAddress })
    TruffleAssert.eventNotEmitted(tx, "ProposalEvent")
  })

  it("should change _executedProposals when a proposal is executed", async () => {
    await BridgeInstance.executeProposal(chainID, depositNonce, resourceID, RecipientAddress, amount, { from: RelayerAddress })
    let dataHash = Helpers.createDataHash(amount, RecipientAddress, HandlerInstance.address);
    let nonceAndID = Helpers.nonceAndId(depositNonce, chainID.toLowerCase())
    let executedProposalBool = await BridgeInstance._executedProposals.call(nonceAndID, dataHash);
    assert.strictEqual(executedProposalBool, true)
  })


})