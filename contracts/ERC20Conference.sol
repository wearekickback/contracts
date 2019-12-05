pragma solidity ^0.5.11;

import './AbstractConference.sol';
import './MyChai.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';

contract ERC20Conference is AbstractConference {

    IERC20 public token; // @todo use a safe transfer proxy
    MyChai public chai;

    constructor(
        string memory _name,
        uint256 _deposit,
        uint256 _limitOfParticipants,
        uint256 _coolingPeriod,
        address payable _owner,
        address  _tokenAddress,
        address  _chaiAddress
    )
        AbstractConference(_name, _deposit, _limitOfParticipants, _coolingPeriod, _owner)
        public
    {
        require(_tokenAddress != address(0), 'token address is not set');
        token = IERC20(_tokenAddress);
        chai = MyChai(_chaiAddress);
        require(chai.daiToken() == token);
    }

    function totalDaiBalance() public returns (uint256){
        return chai.dai(address(this));
    }

    function doWithdraw(address payable participant, uint256 amount) internal {
        chai.draw(address(this), amount);
        token.transfer(participant, amount);
    }

    function doDeposit(address participant, uint256 amount) internal {
        require(msg.value == 0, 'ERC20Conference can not receive ETH');
        token.transferFrom(participant, address(this), amount);
        chai.join(address(this), amount);
    }

    function tokenAddress() public view returns (address){
        return address(token);
    }
}
