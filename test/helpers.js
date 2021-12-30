/**
 * Copyright 2020 ChainSafe Systems
 * SPDX-License-Identifier: LGPL-3.0-only
 */

const Ethers = require('ethers');
const web3 = require('web3');

const AbiCoder = new Ethers.utils.AbiCoder;

const toHex = (covertThis, padding) => {
    return Ethers.utils.hexZeroPad(Ethers.utils.hexlify(covertThis), padding);
};

const abiEncode = (valueTypes, values) => {
    return AbiCoder.encode(valueTypes, values)
};

const getFunctionSignature = (contractInstance, functionName) => {
    return contractInstance.abi.filter(abiProperty => abiProperty.name === functionName)[0].signature;
};

const toBigNumber = (number) => {
    return web3.utils.toBN(number)
}

const createERCDepositData = (tokenAmountOrID, lenRecipientAddress, recipientAddress) => {
    return '0x' +
        toHex(tokenAmountOrID, 32).substr(2) +      // Token amount or ID to deposit (32 bytes)
        toHex(lenRecipientAddress, 32).substr(2) + // len(recipientAddress)          (32 bytes)
        recipientAddress.substr(2);               // recipientAddress               (?? bytes)
};

const createChainID = () => {
    return web3.utils.randomHex(8);
}

// const convertHexToBytes = (address) => {
//     return web3.utils.hexToBytes(address);
// }

const createERC721DepositProposalData = (
    tokenAmountOrID, lenRecipientAddress,
    recipientAddress, lenMetaData, metaData) => {
    return '0x' +
        toHex(tokenAmountOrID, 32).substr(2) +     // Token amount or ID to deposit (32 bytes)
        toHex(lenRecipientAddress, 32).substr(2) + // len(recipientAddress)          (32 bytes)
        recipientAddress.substr(2) +               // recipientAddress               (?? bytes)
        toHex(lenMetaData, 32).substr(2) +
        toHex(metaData, lenMetaData).substr(2)
};

const advanceBlock = () => {
    let provider = new Ethers.providers.JsonRpcProvider();
    const time = Math.floor(Date.now() / 1000);
    return provider.send("evm_mine", [time]);
}

const createDataHash = (amount, recipient, handler) =>{
    let data = abiEncode(["uint256", "address"], [amount, recipient])
    return Ethers.utils.keccak256(handler + data.substr(2))
}

const createGenericDepositData = (hexMetaData) => {
    if (hexMetaData === null) {
        return '0x' +
            toHex(0, 32).substr(2) // len(metaData) (32 bytes)
    }
    const hexMetaDataLength = (hexMetaData.substr(2)).length / 2;
    return '0x' +
        toHex(hexMetaDataLength, 32).substr(2) +
        hexMetaData.substr(2)
};

const createResourceID = (contractAddress, chainID) => {
    return toHex(contractAddress + toHex(chainID, 0).substr(2), 32)
};

const assertObjectsMatch = (expectedObj, actualObj) => {
    for (const expectedProperty of Object.keys(expectedObj)) {
        assert.property(actualObj, expectedProperty, `actualObj does not have property: ${expectedProperty}`);

        let expectedValue = expectedObj[expectedProperty];
        let actualValue = actualObj[expectedProperty];

        // If expectedValue is not null, we can expected actualValue to not be null as well
        if (expectedValue !== null) {
            // Handling mixed case ETH addresses
            // If expectedValue is a string, we can expected actualValue to be a string as well
            if (expectedValue.toLowerCase !== undefined) {
                expectedValue = expectedValue.toLowerCase();
                actualValue = actualValue.toLowerCase();
            }

            // Handling BigNumber.js instances
            if (actualValue.toNumber !== undefined) {
                actualValue = actualValue.toNumber();
            }

            // Truffle seems to return uint/ints as strings
            // Also handles when Truffle returns hex number when expecting uint/int
            if (typeof expectedValue === 'number' && typeof actualValue === 'string' ||
                Ethers.utils.isHexString(actualValue) && typeof expectedValue === 'number') {
                actualValue = parseInt(actualValue);
            }
        }

        assert.deepEqual(expectedValue, actualValue, `expectedValue: ${expectedValue} does not match actualValue: ${actualValue}`);
    }
};

const nonceAndId = (nonce, id) => {
    return Ethers.utils.keccak256(Ethers.utils.hexZeroPad(Ethers.utils.hexlify(nonce), 8) + id.substr(2))
}

module.exports = {
    advanceBlock,
    toHex,
    abiEncode,
    toBigNumber,
    getFunctionSignature,
    createERCDepositData,
    createGenericDepositData,
    createERC721DepositProposalData,
    createResourceID,
    createChainID,
    // convertHexToBytes,
    assertObjectsMatch,
    createDataHash,
    nonceAndId
};
