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
        string calldata _baseTokenUri
    )external returns(Conference c);
}
