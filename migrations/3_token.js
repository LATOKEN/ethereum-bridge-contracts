const { ethers } = require("ethers");
const Web3 = require("web3");

let web3 = new Web3(Web3.givenProvider || "HTTP://172.27.208.1:7545")

const ERC20Handler = artifacts.require("ERC20Handler");
const ExampleToken = artifacts.require("ExampleToken");
const Bridge = artifacts.require("Bridge");

let destChainID = "0x00000000574c4131";
let chainID = "0x00000000004c4131";
let nativeResourceID = "0x00000000000000c4f76f223a578FF90Cc9472D0C3E67679Ef7c824f2d81B4C0F";
let tokenResourceID = "0x000000000000001903eb5D26Aa73D863E9B53B880c9Aeff27A1d40d334095f77";
let amount = '10';
let recipient = "0x7de537fa963f4f713E19a690718190501D15e205";
let depositFee = 10;

module.exports = async function (deployer, network, accounts) {
  // let backendSrvAddress = accounts[1]
  // let bridge = await Bridge.at("0x8F8bB33f58031F0bD855BC6F8bE795424d3648D5");
  // let handler = await ERC20Handler.at("0xA3F45aAd26B733985c5029A7E6Eaa93D802386D4");
  // let erc20 = await ExampleToken.at("0xf8920543511F07174624dCfD92E7Ee9362915d0b");
  // await deployer.deploy(Bridge, chainID, depositFee, backendSrvAddress);
  // let bridge = await Bridge.deployed();
  // console.log(bridge.address, "eth Bridge")

  // await deployer.deploy(ERC20Handler, Bridge.address, [], [], [])
  // let handler = await ERC20Handler.deployed();
  // console.log("Handler address: " + handler.address);

  // await deployer.deploy(ExampleToken, "LA", "LA", 18);
  // let erc20 = await ExampleToken.deployed()
  // console.log("Token address", erc20.address)
  // console.log(await bridge._resourceIDToHandlerAddress(resourceID))
  // await bridge.adminSetNativeResourceID(resourceID)

  // console.log(await bridge._nativeResourceID())

  // console.log(await bridge.adminSetBackendSrv(backendSrvAddress));

  // await bridge.adminSetResource(handler.address, tokenResourceID, erc20.address); //map resourceID to token and handler of that token
  // let minterRole = await erc20.MINTER_ROLE();
  // await erc20.grantRole(minterRole, handler.address); //provide minter role to handler
  // await bridge.adminSetBurnable(handler.address, erc20.address)
  
  // console.log(await bridge.executeProposal(destChainID, chainID, 2, tokenResourceID, "0x1B84F69C40689C85F77c99E6111eA65489593726",10, {from:backendSrvAddress}))
  // console.log(await web3.eth.getBalance("0x1B84F69C40689C85F77c99E6111eA65489593726"))

  // console.log( await erc20.mint(accounts[0], amount));
  //  console.log(await erc20.balanceOf("0x1B84F69C40689C85F77c99E6111eA65489593726"));
  // await erc20.approve(handler.address, amount, {from:accounts[0]}); //approve handler to burn or transfer tokens
  // console.log(await erc20.decimals()); //approve handler to burn or transfer tokens
  // for(var i = 0; i<100; i++){
  // console.log(await bridge.deposit(destChainID, tokenResourceID, amount, recipient, { from: accounts[0], value: (depositFee) }))
  // }
  // console.log(await bridge.deposit(destChainID, nativeResourceID, amount, recipient, {from:accounts[0], value: 20}));  //relayers will vote after this
}