pragma solidity ^0.5.11;

import './AbstractConference.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';

contract ERC20Conference is AbstractConference {

    IERC20 public token; // @todo use a safe transfer proxy

    constructor(
        string memory _name,
        uint256 _deposit,
        uint256 _limitOfParticipants,
        uint256 _coolingPeriod,
        address payable _owner,
        address  _tokenAddress,
        uint256 _clearFee,
        address _deployerAddress
    )
        AbstractConference(_name, _deposit, _limitOfParticipants, _coolingPeriod, _owner, _clearFee, _deployerAddress)
        public
    {
        require(_tokenAddress != address(0), 'token address is not set');
        token = IERC20(_tokenAddress);
    }

    /**
     * @dev Returns total balance of the contract. This function can be deprecated when refactroing front end code.
     * @return The total balance of the contract.
     */
    function totalBalance() view public returns (uint256){
        return token.balanceOf(address(this));
    }

    function doWithdraw(address payable participant, uint256 amount) internal {
        token.transfer(participant, amount);
    }

    function doDeposit(address participant, uint256 amount) internal {
        require(msg.value == 0, 'ERC20Conference can not receive ETH');
        token.transferFrom(participant, address(this), amount);
    }

    function tokenAddress() public view returns (address){
        return address(token);
    }
}
