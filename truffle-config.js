const HDWalletProvider = require('@truffle/hdwallet-provider');
const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim();
var NonceTrackerSubprovider = require("@trufflesuite/web3-provider-engine/subproviders/nonce-tracker")

module.exports = {
  networks: {
    development: {
      provider: () => {
        return new HDWalletProvider(mnemonic, 'HTTP://172.27.208.1:7545')
      },
      // host: "127.0.0.1",     // Localhost (default: none)
      // port: 8545,            // Standard Ethereum port (default: none)
      network_id: "*",       // Any network (default: none)
    },
    mumbai: {
      provider: () => {
        var wallet = new HDWalletProvider(mnemonic, 'https://rpc-mumbai.maticvigil.com/')
        // var nonceTracker = new NonceTrackerSubprovider()
        // wallet.engine._providers.unshift(nonceTracker)
        // nonceTracker.setEngine(wallet.engine)
        return wallet
      },
      network_id: 80001,
      // confirmations: 2,
      // timeoutBlocks: 200,
      skipDryRun: true
    },
    bsctestnet: {
      provider: () => {
        return new HDWalletProvider(mnemonic, 'https://data-seed-prebsc-1-s2.binance.org:8545/')
      },
      network_id: 97,
      // confirmations: 2,
      // timeoutBlocks: 200,
      skipDryRun: true
    },
    ropsten: {
      provider: () => {
        return new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/v3/9a6feb0c6140449c9997d5f98b2a3665')
      },
      network_id: 3,
      // confirmations: 2,
      // timeoutBlocks: 200,
      skipDryRun: true
    }
  },
  plugins: ["solidity-coverage"],

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.6.4",
    }
  }
}