pragma solidity ^0.5.11;
import './EthConference.sol';
import './Conference.sol';
import './DeployerInterface.sol';
//Deployed at 0x05289CEbDB9dbF9B79C521c3390dd6BF1e253421 Polygon Testnet

contract EthDeployer is DeployerInterface{
    function deploy(
        string calldata _name,
        uint256 _deposit,
        uint _limitOfParticipants,
        uint _coolingPeriod,
        address payable _ownerAddress,
        address /* _tokenAddress */,
        uint256 _clearFee,
        uint8 _yieldReceiver,
        address payable _designee,
        address _provider,
        address _wethGateway
    )external returns(Conference c){
        c = new EthConference(
            _name,
            _deposit,
            _limitOfParticipants,
            _coolingPeriod,
            _ownerAddress,
            _clearFee,
             _yieldReceiver,
            _designee,
            _provider,
            _wethGateway
        );
    }   
}
