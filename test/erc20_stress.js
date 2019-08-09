const { toWei } = require('web3-utils')
const EthVal = require('ethval')
const Conference = artifacts.require("ERC20Conference.sol");
const Token = artifacts.require("MyToken.sol");

const { shouldStressTest } = require('./behaviors/stress.behavior');
const { shouldHandleLargeParty } = require('./behaviors/conferenceFinalize.behavior');

web3.currentProvider.sendAsync = web3.currentProvider.send

contract('ERC20 Conference', function(accounts) {
  let token;
  beforeEach(async function(){
    token = await Token.new();
    this.accounts = accounts
    this.createConference = ({
      name = '',
      deposit = toWei('0.02', "ether"),
      limitOfParticipants = 20,
      coolingPeriod = 0,
      ownerAddress = accounts[0],
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

  // describe('on various party size', function(){
  //   shouldStressTest();
  // })

  // describe('on big party', function(){
  //   shouldHandleLargeParty();
  // })
})
