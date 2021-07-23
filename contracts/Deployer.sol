pragma solidity ^0.5.11;

import './GroupAdmin.sol';
import './zeppelin/lifecycle/Destructible.sol';
import './DeployerInterface.sol';

/**
 * This is responsible for deploying a new Party.
 */
 //Deployed at 0x42a0f7C4015bC49668f181b91bBCB1609631479e Polygon testnet

contract Deployer is Destructible, GroupAdmin {
    DeployerInterface ethDeployer;
    DeployerInterface erc20Deployer;
    uint public clearFee;
    constructor(address _ethDeployer, address _erc20Deployer, uint _clearFee) public {
        ethDeployer = DeployerInterface(_ethDeployer);
        erc20Deployer = DeployerInterface(_erc20Deployer);
        clearFee = _clearFee;
    }
    /**
     * Notify that a new party has been deployed.
     */
    event NewParty(
        address indexed deployedAddress,
        address indexed deployer
    );

    event ClearFeeChanged(
        uint indexed clearFee
    );

    function changeClearFee(uint _clearFee) external onlyAdmin {
        clearFee = _clearFee;
        emit ClearFeeChanged(clearFee);
    }

    /**
     * Deploy a new contract.
     * @param _name The name of the event
     * @param _deposit The amount each participant deposits. The default is set to 0.02 Ether. The amount cannot be changed once deployed.
     * @param _limitOfParticipants The number of participant. The default is set to 20. The number can be changed by the owner of the event.
     * @param _coolingPeriod The period participants should withdraw their deposit after the event ends. After the cooling period, the event owner can claim the remining deposits.
     * @param _tokenAddress If this address is passed, deploy ERC20Token version
     */
    function deploy(
        string calldata _name,
        uint256 _deposit,
        uint _limitOfParticipants,
        uint _coolingPeriod,
        address _tokenAddress,
        uint8 _yieldReceiver,
        address payable _designee,
        address _provider,
        address _wethGateway
    ) external {
        Conference c;
        if(_tokenAddress != address(0)){
            c = erc20Deployer.deploy(
                _name,
                _deposit,
                _limitOfParticipants,
                _coolingPeriod,
                msg.sender,
                _tokenAddress,
                clearFee,
                _yieldReceiver,
                _designee,
                _provider,
                _wethGateway
            );
        }else{
            c = ethDeployer.deploy(
                _name,
                _deposit,
                _limitOfParticipants,
                _coolingPeriod,
                msg.sender,
                address(0),
                clearFee,
                _yieldReceiver,
                _designee,
                _provider,
                _wethGateway
            );
        }
        emit NewParty(address(c), msg.sender);
    }
}
