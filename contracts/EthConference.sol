// SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

import './AbstractConference.sol';
import './Conference.sol';

contract EthConference is AbstractConference, Conference {
    constructor(
        string memory _name,
        uint256 _deposit,
        uint256 _limitOfParticipants,
        uint256 _coolingPeriod,
        address payable _owner,
        uint256 _clearFee
    )
        AbstractConference(_name, _deposit, _limitOfParticipants, _coolingPeriod, _owner, _clearFee)
        public
    {
    }

    /**
     * @dev Returns total balance of the contract. This function can be deprecated when refactroing front end code.
     * @return The total balance of the contract.
     */
    function totalBalance() public view override returns (uint256){
        return address(this).balance;
    }

    function doWithdraw(address payable participant, uint256 amount) internal override{
        participant.transfer(amount);
    }

    function doDeposit(address, uint256 amount) internal override{
        require(msg.value == amount, 'must send exact deposit amount');
    }

    function tokenAddress() public override view returns (address){
        return address(0);
    }
}
