pragma solidity 0.6.4;

import "./libraries/SafeMath.sol";
import "./interfaces/IERC721.sol";

/**
    @title Manages deposited ERC721s.
    @notice This contract is intended to be used with ERC721Handler contract.
 */
contract ERC721Safe {
    using SafeMath for uint256;

    /**
        @notice Used to transfer tokens into the safe to fund proposals.
        @param tokenAddress Address of ERC721 to transfer.
        @param owner Address of current token owner.
        @param tokenID ID of token to transfer.
     */
    function fundERC721(address tokenAddress, address owner, uint tokenID) public {
        IERC721 erc721 = IERC721(tokenAddress);
        erc721.transferFrom(owner, address(this), tokenID);
    }

    /**
        @notice Used to gain custoday of deposited token.
        @param tokenAddress Address of ERC721 to transfer.
        @param owner Address of current token owner.
        @param recipient Address to transfer token to.
        @param tokenID ID of token to transfer.
     */
    function lockERC721(address tokenAddress, address owner, address recipient, uint tokenID) internal {
        IERC721 erc721 = IERC721(tokenAddress);
        erc721.transferFrom(owner, recipient, tokenID);

    }

    /**
        @notice Transfers custody of token to recipient.
        @param tokenAddress Address of ERC721 to transfer.
        @param owner Address of current token owner.
        @param recipient Address to transfer token to.
        @param tokenID ID of token to transfer.
     */
    function releaseERC721(address tokenAddress, address owner, address recipient, uint256 tokenID) internal {
        IERC721 erc721 = IERC721(tokenAddress);
        erc721.transferFrom(owner, recipient, tokenID);
    }

}
