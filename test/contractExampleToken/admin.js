/**
 * SPDX-License-Identifier: LGPL-3.0-only
 */
const TruffleAssert = require('truffle-assertions');
const Helpers = require('../helpers');

const ERC20MintableContract = artifacts.require("ExampleToken");

contract('ExampleToken - [admin]', async accounts => {
  let ADMIN_ROLE;

  let TokenInstance;

  beforeEach(async () => {
    TokenInstance = await ERC20MintableContract.new("Token", "tk1");
    ADMIN_ROLE = await TokenInstance.DEFAULT_ADMIN_ROLE();
  });

  it("Token should not pe paused", async () => {
    assert.isFalse(await TokenInstance.paused());
  })

  it("Token should be paused", async () => {
    TruffleAssert.passes(await TokenInstance.pause())
    assert.strictEqual(await TokenInstance.paused(), true);
  })

  it('Token should be unpaused after being paused', async () => {
    TruffleAssert.passes(await TokenInstance.pause());
    assert.strictEqual(await TokenInstance.paused(), true);
    TruffleAssert.passes(await TokenInstance.unpause());
    assert.strictEqual(await TokenInstance.paused(), false);
  });
})