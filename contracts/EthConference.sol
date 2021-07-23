pragma solidity ^0.5.11;
pragma experimental ABIEncoderV2;

import './AbstractConference.sol';
import './bank/aave/ILendingPoolAddressesProvider.sol';
import './bank/aave/IlendingPool.sol';
import './bank/weth/IWethGateway.sol';
import './zeppelin/ERC20/IERC20.sol';

//address for polygon aave can be found at https://docs.aave.com/developers/deployed-contracts/matic-polygon-market
//Deployed at 0xD033E0cf5b7330363b21880759a9546B30Dc7d6a for _yieldReceiver =1
//Deployed at 0x360696678c62F40E51E54Ade1AC82778FD0B5FCD for _yieldReceiver =2
//Deployed at 0x5DbE12b2Ca0c3e0B8f6a2fBf431D2B3e59aeB0Ad for _yieldReceiver =3

contract EthConference is AbstractConference {
    address internal lendingPool;
    IWETHGateway internal IWethGateway;
    address internal interestToken ;//= 0xF45444171435d0aCB08a8af493837eF18e86EE27;// for amWMatic
    
    function() external payable{} //catcher for the returned matic
    
    constructor(
        string memory _name,
        uint256 _deposit,
        uint256 _limitOfParticipants,
        uint256 _coolingPeriod,
        address payable _owner,
        uint256 _clearFee,
        uint8 _yieldReceiver,
        address payable _designee,
        address _provider,
        address _wethGateway
    )
        AbstractConference(_name, _deposit, _limitOfParticipants, _coolingPeriod, _owner, _clearFee,_yieldReceiver,_designee)
        public
    {
        require(_provider != address(0),'');
        require(_wethGateway != address(0),'weth address not 0');
        IWethGateway = IWETHGateway(_wethGateway);
        lendingPool = ILendingPoolAddressesProvider(_provider).getLendingPool();
        interestToken=ILendingPool(lendingPool).getReserveData(IWethGateway.getWETHAddress()).aTokenAddress;
    }

    /**
     * @dev Returns total balance of the contract. This function can be deprecated when refactroing front end code.
     * @return The total balance of the contract.
     */
    function totalBalance() view public returns (uint256){
        return address(this).balance;
    }

    function doWithdraw(address payable participant, uint256 amount) internal{
        participant.transfer(amount);
    }

    function doDeposit(address, uint256 amount) internal {
        require(msg.value == amount, 'must send exact deposit amount');
    }

    function tokenAddress() public view returns (address){
        return address(0);
    }

    function doBankDeposit() internal {
        require(this.banked() != true,'already banked');
        IWETHGateway(IWethGateway).depositETH.value(address(this).balance)(lendingPool,address(this),0);//deposit into aave
        AbstractConference.setBanked(true);
    }
    function doBankWithdraw() internal {
        require(this.banked(), 'First call bank');
        IERC20(interestToken).approve(address(IWethGateway),IERC20(interestToken).balanceOf(address(this)));//apporve to spend amWMatic
        IWETHGateway(IWethGateway).withdrawETH(lendingPool,uint256(-1),address(this));//
        AbstractConference.setBanked(false);
    }

}
