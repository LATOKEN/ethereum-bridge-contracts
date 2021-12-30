const Bridge = artifacts.require("Bridge");
const RelayerHub = artifacts.require("RelayerHub");
const ERC20Handler = artifacts.require("ERC20Handler");
const ExampleToken = artifacts.require("ExampleToken");

let chainID = "0x0000000000000061";
let la1RecourceID = "0x00000000000000D63B2709A32E4a7dF0eAA162aa2d8D5d0135a256a00230d147"; //cannot be random (to map to other chains)
let usdtRecourceID = "0x000000000000001903eb5D26Aa73D863E9B53B880c9Aeff27A1d40d334095f77"; //cannot be random (to map to other chains)
let nativeRecourceID = "0x00000000000000e6d7DC99370DD5589E2ACF3544DABC96a5543EBE71e3FE2388"; //cannot be random (to map to other chains)
let laResourceID = "0x5d9633ae98cc9ce999df86a069470e931d590bc7f34d0abca36bfeb5f0d9113a"; //cannot be random (to map to other chains)
let depositFee = 10;
let penaltyPercentage = 10;
let rewardPercentage = 10;
let backendSrvAddress = "0x0e3aC56774E282F7fF4F544ef996F1cf4331C3c5";
let amount = '100000000000000000000000000000'

module.exports = async function (deployer, network, accounts) {

  await deployer.deploy(Bridge, chainID, depositFee, "0x0e3aC56774E282F7fF4F544ef996F1cf4331C3c5");
  // let bridge = await Bridge.at("0x38ff825b0052fa116Aa06C479718429B570aD9e4");
  let bridge = await Bridge.deployed();
  console.log("Bridge address: "+ bridge.address );

  await deployer.deploy(ERC20Handler, bridge.address);
  // let handler = await ERC20Handler.at("0x0f1DA9122c0c13b5410677ce2C311787654B4d14");
  let handler = await ERC20Handler.deployed();
  console.log("Handler address: "+ handler.address);

  console.log(await bridge.adminSetNativeResourceID(nativeRecourceID))
  // await deployer.deploy(ExampleToken, "LA", "LA", 18);
  let la1 = await ExampleToken.at("0xE5EF9365F43bdd8C4d1bD161304d681e79Fb742F")
  let usdt = await ExampleToken.at("0xAC752a527E772b9a4b9B66442a008Fd761ad97e5")
  let la = await ExampleToken.at("0xBe8214978DB8bc79339308B5EA0AdEa7c1D8383E")
  // let erc20 = await ExampleToken.deployed()
  // console.log("LA1 Token address: "+ erc20.address);

  // await bridge.adminSetBackendSrv("0xacF016d0459d073e4f4620A899e3CA910d7bE5ef"); //set relayerHub
  console.log(await bridge.adminSetResource(handler.address, laResourceID, la.address)); //map resourceID to token and handler of that token
  console.log(await bridge.adminSetResource(handler.address, la1RecourceID, la1.address)); //map resourceID to token and handler of that token
  console.log(await bridge.adminSetResource(handler.address, usdtRecourceID, usdt.address)); //map resourceID to token and handler of that token
  // console.log(await bridge._nativeResourceID())
  // console.log(await handler._burnList("0xAC752a527E772b9a4b9B66442a008Fd761ad97e5"))
  //for burnable tokens
  // await bridge.adminSetBurnable(handler.address, erc20.address);
  // console.log("la1 burnable")
  // await bridge.adminSetBurnable(handler.address, erc20.address);
  // console.log("usdt burnable")
  // let minterRole = await erc20.MINTER_ROLE();
  // console.log(await erc20.grantRole(minterRole, handler.address)) //provide minter role to handler
  // console.log(await erc20.grantRole(minterRole, handler.address)) //provide minter role to handler
  console.log(await usdt.mint(handler.address, amount)) //provide minter role to handler
  console.log(await la1.mint(handler.address, amount)) //provide minter role to handler
  console.log(await la.mint(handler.address, amount)) //provide minter role to handler

}