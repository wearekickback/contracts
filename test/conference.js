const { toWei } = require('web3-utils')
const EthVal = require('ethval')
const Conference = artifacts.require("./ETHConference.sol");

const { getBalance } = require('./utils')
const { shouldBehaveLikeConference } = require('./behaviors/conference.behavior');
const { shouldStressTest } = require('./behaviors/stress.behavior');
web3.currentProvider.sendAsync = web3.currentProvider.send

contract('ETH Conference', function(accounts) {

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
      return Conference.new(
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

  describe('on registration', function(){
    shouldBehaveLikeConference();
  })

  describe('under pressure', function(){
    shouldStressTest();
  })

})
