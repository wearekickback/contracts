// SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
import './ERC20Conference.sol';
import './Conference.sol';
import './DeployerInterface.sol';

contract ERC20Deployer is DeployerInterface{
    function deploy(
        string calldata _name,
        uint256 _deposit,
        uint _limitOfParticipants,
        uint _coolingPeriod,
        address payable _ownerAddress,
        address _tokenAddress,
        uint256 _clearFee
    )external returns(Conference c){
        c = new ERC20Conference(
            _name,
            _deposit,
            _limitOfParticipants,
            _coolingPeriod,
            _ownerAddress,
            _tokenAddress,
            _clearFee
        );
    }   
}
