const { toWei } = require('web3-utils')
const EthVal = require('ethval')
const Conference = artifacts.require("ETHConference.sol");

const { getBalance } = require('./utils')
const { shouldBehaveLikeConference } = require('./behaviors/conference.behavior');
web3.currentProvider.sendAsync = web3.currentProvider.send

contract('ETH Conference', function(accounts) {

  beforeEach(async function(){
    this.accounts = accounts
    this.createConference = () => {
      return Conference.new(
        '',
        toWei('0.02', "ether"),
        0,
        0,
        '0x0000000000000000000000000000000000000000'
      );
    }
    this.getBalance =  async (account) => {
      return new EthVal(await getBalance(account))
    }
    this.register = async function(conference, deposit, user, _){
      await conference.register({value:deposit, from: user});
      return true;
    }
  })

  describe('on registration', function(){
    shouldBehaveLikeConference();
  })
})
