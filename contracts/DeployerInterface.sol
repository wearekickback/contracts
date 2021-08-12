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
        address _deployerAddress
    )external returns(Conference c);
}
