// SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
import './Conference.sol';

interface DeployerInterface {
    function deploy(
        string calldata _name,
        uint256 _deposit,
        uint _limitOfParticipants,
        uint _coolingPeriod,
        address payable _ownerAddress,
        address _tokenAddress,
        uint256 _clearFee
    )external returns(Conference c);
}
