const { toWei } = require('web3-utils')
const Conference = artifacts.require("ERC20Conference.sol");
const Token = artifacts.require("MyToken.sol");
const EthVal = require('ethval')

web3.currentProvider.sendAsync = web3.currentProvider.send

const { shouldBehaveLikeConference } = require('./behaviors/conference.behavior');
const { shouldStressTest } = require('./behaviors/stress.behavior');

contract('ERC20 Conference', function(accounts) {
  let token;

  beforeEach(async function(){
    token = await Token.new();
    this.accounts = accounts
    this.createConference = ({
      name = '',
      deposit = toWei('0.02', "ether"),
      limitOfParticipants = 0,
      coolingPeriod = 0,
      ownerAddress = '0x0000000000000000000000000000000000000000',
      tokenAdderss = token.address,
      gasPrice = toWei('1', 'gwei')
    }) => {
      return Conference.new(
        name,
        deposit,
        limitOfParticipants,
        coolingPeriod,
        ownerAddress,
        tokenAdderss
        , {gasPrice:gasPrice}
      );
    }
    this.getBalance = async (account) => {
      return new EthVal(await token.balanceOf(account));
    }
    this.register = async function({conference, deposit, user, owner, gasPrice = toWei('1', "gwei")}){
      if(owner){
        token.transfer(user, deposit, {from:owner, gasPrice})
      }
      await token.approve(conference.address, deposit, { from: user, gasPrice });
      return await conference.register({ from: user, gasPrice });
    }
  })

  describe('on registration', function(){
    shouldBehaveLikeConference();
  })

  describe('under pressure', function(){
    shouldStressTest();
  })
})
