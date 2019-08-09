const { toWei } = require('web3-utils')
const EthVal = require('ethval')
const EthConference = artifacts.require("./EthConference.sol");
const ERC20Conference = artifacts.require("ERC20Conference.sol");
const Token = artifacts.require("MyToken.sol");

const { getBalance } = require('./utils')
const { shouldStressTest } = require('./behaviors/stress.behavior');
const { shouldHandleLargeParty } = require('./behaviors/conferenceFinalize.behavior');

web3.currentProvider.sendAsync = web3.currentProvider.send

contract('Large event', function(accounts) {
  describe('ETH Conference', function() {
    beforeEach(async function(){
      this.accounts = accounts
      this.createConference = ({
        name = '',
        deposit = toWei('0.02', "ether"),
        limitOfParticipants = 20,
        coolingPeriod = 0,
        ownerAddress = accounts[0],
        gasPrice = toWei('1', 'gwei')
      }) => {
        return EthConference.new(
          name,
          deposit,
          limitOfParticipants,
          coolingPeriod,
          ownerAddress
          , {gasPrice:gasPrice}
        );
      }
      this.getBalance =  async (account) => {
        return new EthVal(await getBalance(account))
      }
      this.register = async function({conference, deposit, user, gasPrice = toWei('1', 'gwei')}){
        return await conference.register({value:deposit, from: user, gasPrice});
      }
    })

    describe('on various party size', function(){
      shouldStressTest();
    })

    describe('on big party', function(){
      shouldHandleLargeParty();
    })
  })
  describe('ERC20 Conference', function() {
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
        return ERC20Conference.new(
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

    describe('on big party', function(){
      shouldHandleLargeParty();
    })
  })
})
