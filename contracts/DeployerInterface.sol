pragma solidity ^0.5.11;
import './Conference.sol';

interface DeployerInterface {
    function deploy(
        string calldata _name,
        uint256 _deposit,
        uint _limitOfParticipants,
        uint _coolingPeriod,
        address payable _ownerAddress,
        address _tokenAddress,
        uint256 _clearFee,
        uint8 _yieldReceiver,
        address payable _designee,
        address _provider,
        address _wethGateway  
    )external returns(Conference c);
}
