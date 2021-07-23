pragma solidity ^0.5.11;
pragma experimental ABIEncoderV2;

import './AbstractConference.sol';
import './bank/aave/ILendingPoolAddressesProvider.sol';
import './bank/aave/IlendingPool.sol';
import './zeppelin/ERC20/IERC20.sol';
//Deployed at 0xBF49164c98c5feEA946DB766493558d5Cee0e16e Polygon testnet _yieldReceiver=1

contract ERC20Conference is AbstractConference {

    IERC20 public token; // @todo use a safe transfer proxy
    address internal lendingPool;
    address internal interestToken ;

    function() external payable{} //catcher for the returned matic

    constructor(
        string memory _name,
        uint256 _deposit,
        uint256 _limitOfParticipants,
        uint256 _coolingPeriod,
        address payable _owner,
        address  _tokenAddress,
        uint256 _clearFee,
        uint8 _yieldReceiver,
        address payable _designee,
        address _provider
    )
        AbstractConference(_name, _deposit, _limitOfParticipants, _coolingPeriod, _owner, _clearFee,_yieldReceiver,_designee)
        public
    {
        require(_tokenAddress != address(0), 'token address is not set');
        require(_provider != address(0),'');
        token = IERC20(_tokenAddress);//the token the event accepts
        lendingPool = ILendingPoolAddressesProvider(_provider).getLendingPool();//the aave Lending pool
        interestToken = ILendingPool(lendingPool).getReserveData(_tokenAddress).aTokenAddress;// get the atoken for the provided token
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
    function doBankDeposit() internal {
        require(this.banked() != true,'already banked');
        token.approve(lendingPool, totalBalance());//approve to spend ERC20 Token
        ILendingPool(lendingPool).deposit(address(token),totalBalance(),address(this),0);//deposit into aave
         AbstractConference.setBanked(true);
    }
    function doBankWithdraw() internal {
        require(this.banked(), 'First call bank');
        IERC20(interestToken).approve(lendingPool,IERC20(interestToken).balanceOf(address(this)));//approve to spend amWToken
        ILendingPool(lendingPool).withdraw(address(token), uint256(-1), address(this));//withdraw from aave
        AbstractConference.setBanked(false);
    }

}
