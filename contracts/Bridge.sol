pragma solidity 0.6.4;
pragma experimental ABIEncoderV2;

import "./utils/Pausable.sol";
import "./utils/SafeMath.sol";
import "./interfaces/IDepositExecute.sol";
import "./interfaces/IBridge.sol";
import "./interfaces/IERCHandler.sol";

/**
    @title Facilitates deposits, creation and votiing of deposit proposals, and deposit executions.
 */
contract Bridge is Pausable, SafeMath {
    bytes8 public _chainID;
    uint256 public _fee;
    address _backendSrvAddress;
    address _ownerAddress;

    enum ProposalStatus {
        Inactive,
        Active,
        Passed,
        Executed,
        Cancelled
    }

    bytes32 public _nativeResourceID;

    // destinationChainID => number of deposits
    mapping(bytes8 => uint64) public _depositCounts;
    // resourceID => handler address
    mapping(bytes32 => address) public _resourceIDToHandlerAddress;
    // depositNonce => destinationChainID => bytes
    mapping(uint64 => mapping(bytes8 => bytes)) public _depositRecords;
    // destinationChainID + depositNonce => dataHash => bool
    mapping(bytes32 => mapping(bytes32 => bool)) public _executedProposals;

    event Deposit(
        bytes8 originChainID,
        bytes8 indexed destinationChainID,
        bytes32 indexed resourceID,
        uint64 indexed depositNonce,
        address depositor,
        address recipientAddress,
        address tokenAddress,
        uint256 amount,
        bytes32 dataHash
    );
    event ProposalEvent(
        bytes8 indexed originChainID,
        bytes8 indexed destinationChainID,
        address indexed recipientAddress,
        uint256 amount,
        uint64 depositNonce,
        ProposalStatus status,
        bytes32 resourceID,
        bytes32 dataHash
    );
    event ExtraFeeSupplied(
        bytes8 originChainID,
        bytes8 destinationChainID,
        address recipientAddress,
        uint256 amount
    );

    modifier onlyAdmin() {
        _onlyAdmin();
        _;
    }

    modifier onlyBackendSrv() {
        _onlyBackendSrv();
        _;
    }

    function _onlyAdmin() private view {
        require(msg.sender == _ownerAddress, "sender doesn't have admin role");
    }

    function _onlyBackendSrv() private view {
        require(
            _backendSrvAddress == msg.sender,
            "sender is not a backend service"
        );
    }

    /**
        @notice Initializes Bridge, creates and grants {msg.sender} the admin role,
        creates and grants {initialRelayers} the relayer role.
        @param chainID ID of chain the Bridge contract exists on.
     */
    constructor(
        bytes8 chainID,
        uint256 fee,
        address initBackendSrvAddress
    ) public {
        _chainID = chainID;
        _fee = fee;
        _backendSrvAddress = initBackendSrvAddress;

        _ownerAddress = msg.sender;
    }

    /**
        @notice sets new backend srv.
        @notice Only callable by an address that currently has the admin role.
        @param newBackendSrv Address of new backend srv.
     */
    function adminSetBackendSrv(address newBackendSrv) external onlyAdmin {
        _backendSrvAddress = newBackendSrv;
    }

    /**
        @notice Removes admin role from {msg.sender} and grants it to {newAdmin}.
        @notice Only callable by an address that currently has the admin role.
        @param newAdmin Address that admin role will be granted to.
     */
    function renounceAdmin(address newAdmin) external onlyAdmin {
        _ownerAddress = newAdmin;
    }

    /**
        @notice Pauses deposits, proposal creation and voting, and deposit executions.
        @notice Only callable by an address that currently has the admin role.
     */
    function adminPauseTransfers() external onlyAdmin {
        _pause();
    }

    /**
        @notice Unpauses deposits, proposal creation and voting, and deposit executions.
        @notice Only callable by an address that currently has the admin role.
     */
    function adminUnpauseTransfers() external onlyAdmin {
        _unpause();
    }

    /**
        @notice Sets a new resource for handler contracts that use the IERCHandler interface,
        and maps the {handlerAddress} to {resourceID} in {_resourceIDToHandlerAddress}.
        @notice Only callable by an address that currently has the admin role.
        @param handlerAddress Address of handler resource will be set for.
        @param resourceID ResourceID to be used when making deposits.
        @param tokenAddress Address of contract to be called when a deposit is made and a deposited is executed.
     */
    function adminSetResource(
        address handlerAddress,
        bytes32 resourceID,
        address tokenAddress
    ) external onlyAdmin {
        _resourceIDToHandlerAddress[resourceID] = handlerAddress;
        IERCHandler handler = IERCHandler(handlerAddress);
        handler.setResource(resourceID, tokenAddress);
    }

    function adminSetNativeResourceID(bytes32 resourceID) external onlyAdmin {
        _nativeResourceID = resourceID;
    }

    /**
        @notice Sets a resource as burnable for handler contracts that use the IERCHandler interface.
        @notice Only callable by an address that currently has the admin role.
        @param handlerAddress Address of handler resource will be set for.
        @param tokenAddress Address of contract to be called when a deposit is made and a deposited is executed.
     */
    function adminSetBurnable(address handlerAddress, address tokenAddress)
        external
        onlyAdmin
    {
        IERCHandler handler = IERCHandler(handlerAddress);
        handler.setBurnable(tokenAddress);
    }

    /**
        @notice Changes deposit fee.
        @notice Only callable by admin.
        @param newFee Value {_fee} will be updated to.
     */
    function adminChangeFee(uint256 newFee) external onlyAdmin {
        require(_fee != newFee, "Current fee is equal to new fee");
        _fee = newFee;
    }

    /**
        @notice Used to manually withdraw funds from ERC safes.
        @param handlerAddress Address of handler to withdraw from.
        @param tokenAddress Address of token to withdraw.
        @param recipient Address to withdraw tokens to.
        @param amountOrTokenID Either the amount of ERC20 tokens or the ERC721 token ID to withdraw.
     */
    function adminWithdraw(
        address handlerAddress,
        address tokenAddress,
        address recipient,
        uint256 amountOrTokenID
    ) external onlyAdmin {
        IERCHandler handler = IERCHandler(handlerAddress);
        handler.withdraw(tokenAddress, recipient, amountOrTokenID);
    }

    /**
        @notice Initiates a transfer using a specified handler contract.
        @notice Only callable when Bridge is not paused.
        @param destinationChainID ID of chain deposit will be bridged to.
        @param resourceID ResourceID used to find address of handler to be used for deposit.
        @notice Emits {Deposit} event.
     */
    function deposit(
        bytes8 destinationChainID,
        bytes32 resourceID,
        uint256 amount,
        address recipientAddress
    ) external payable whenNotPaused {
        uint64 depositNonce = ++_depositCounts[destinationChainID];
        bytes memory data = abi.encode(amount, recipientAddress);
        bytes32 dataHash = keccak256(abi.encode(resourceID, data));
        _depositRecords[depositNonce][destinationChainID] = data;

        address tokenAddress;

        if (resourceID == _nativeResourceID) {
            require(
                msg.value >= (amount + _fee),
                "Incorrect fee/amount supplied"
            );

            tokenAddress = address(0);

            if (msg.value > (_fee + amount)) {
                emit ExtraFeeSupplied(
                    _chainID,
                    destinationChainID,
                    recipientAddress,
                    sub(msg.value, _fee + amount)
                );
            }
        } else {
            require(msg.value >= _fee, "Incorrect fee supplied");

            address handler = _resourceIDToHandlerAddress[resourceID];
            require(handler != address(0), "resourceID not mapped to handler");

            tokenAddress = IDepositExecute(handler).deposit(
                resourceID,
                destinationChainID,
                depositNonce,
                msg.sender,
                recipientAddress,
                amount
            );
            if (msg.value > _fee) {
                emit ExtraFeeSupplied(
                    _chainID,
                    destinationChainID,
                    recipientAddress,
                    sub(msg.value, _fee)
                );
            }
        }

        emit Deposit(
            _chainID,
            destinationChainID,
            resourceID,
            depositNonce,
            msg.sender,
            recipientAddress,
            tokenAddress,
            amount,
            dataHash
        );
    }

    /**
        @notice Executes a deposit proposal that is considered passed using a specified handler contract.
        @notice Only callable by relayers when Bridge is not paused.
        @param destinationChainID ID of chain where proposal is executed.
        @param resourceID ResourceID to be used when making deposits.
        @param depositNonce ID of deposited generated by origin Bridge contract.
        @notice Proposal must not have executed before.
        @notice Emits {ProposalEvent} event with status {Executed}.
     */
    function executeProposal(
        bytes8 originChainID,
        bytes8 destinationChainID,
        uint64 depositNonce,
        bytes32 resourceID,
        address payable recipientAddress,
        uint256 amount
    ) external onlyBackendSrv whenNotPaused {
        bytes memory data = abi.encode(amount, recipientAddress);
        bytes32 nonceAndID = keccak256(abi.encode(depositNonce, originChainID, destinationChainID));
        bytes32 dataHash = keccak256(abi.encode(resourceID, data));

        require(
            !_executedProposals[nonceAndID][dataHash],
            "proposal already executed"
        );
        require(destinationChainID == _chainID, "ChainID Incorrect");

        _executedProposals[nonceAndID][dataHash] = true;

        if (resourceID == _nativeResourceID) {
            recipientAddress.transfer(amount);
        } else {
            address handler = _resourceIDToHandlerAddress[resourceID];
            require(handler != address(0), "resourceID not mapped to handler");

            IDepositExecute depositHandler = IDepositExecute(handler);
            depositHandler.executeProposal(
                resourceID,
                recipientAddress,
                amount
            );
        }

        emit ProposalEvent(
            originChainID,
            destinationChainID,
            recipientAddress,
            amount,
            depositNonce,
            ProposalStatus.Executed,
            resourceID,
            dataHash
        );
    }
}
