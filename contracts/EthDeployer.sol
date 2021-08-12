pragma solidity ^0.5.11;
import './EthConference.sol';
import './Conference.sol';
import './DeployerInterface.sol';

contract EthDeployer is DeployerInterface{
    function deploy(
        string calldata _name,
        uint256 _deposit,
        uint _limitOfParticipants,
        uint _coolingPeriod,
        address payable _ownerAddress,
        address /* _tokenAddress */,
        uint256 _clearFee,
        address _deployerAddress
    )external returns(Conference c){
        c = new EthConference(
            _name,
            _deposit,
            _limitOfParticipants,
            _coolingPeriod,
            _ownerAddress,
            _clearFee,
            _deployerAddress
        );
    }   
}
