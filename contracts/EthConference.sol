pragma solidity ^0.5.11;

import './AbstractConference.sol';

contract EthConference is AbstractConference {
    constructor(
        string memory _name,
        uint256 _deposit,
        uint256 _limitOfParticipants,
        uint256 _coolingPeriod,
        address payable _owner,
        uint256 _clearFee,
        address _deployerAddress
    )
        AbstractConference(_name, _deposit, _limitOfParticipants, _coolingPeriod, _owner, _clearFee, _deployerAddress)
        public
    {
    }

    /**
     * @dev Returns total balance of the contract. This function can be deprecated when refactroing front end code.
     * @return The total balance of the contract.
     */
    function totalBalance() view public returns (uint256){
        return address(this).balance;
    }

    function doWithdraw(address payable participant, uint256 amount) internal {
        participant.transfer(amount);
    }

    function doDeposit(address, uint256 amount) internal {
        require(msg.value == amount, 'must send exact deposit amount');
    }

    function tokenAddress() public view returns (address){
        return address(0);
    }
}
