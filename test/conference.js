const { toWei } = require('web3-utils')
const EthVal = require('ethval')
const Conference = artifacts.require("./EthConference.sol");
const DummyProxy = artifacts.require("./DummyProxy.sol");

const { getBalance } = require('./utils')
const { shouldBehaveLikeConference } = require('./behaviors/conference.behavior');

web3.currentProvider.sendAsync = web3.currentProvider.send

contract('ETH Conference', function(accounts) {
  let dummyProxy
  beforeEach(async function(){
    this.accounts = accounts
    dummyProxy = await DummyProxy.new();
    this.createConference = ({
      name = '',
      deposit = toWei('0.02', "ether"),
      limitOfParticipants = 20,
      coolingPeriod = 0,
      ownerAddress = accounts[0],
      clearFee = 10,
      gasPrice = toWei('1', 'gwei')
    }) => {
      return Conference.new(
        name,
        deposit,
        limitOfParticipants,
        coolingPeriod,
        ownerAddress,
        clearFee
        , {gasPrice:gasPrice}
      );
    }
    this.getBalance =  async (account) => {
      return new EthVal(await getBalance(account))
    }
    this.register = async function({
      conference, deposit, user,
      gasPrice = toWei('1', 'gwei'), proxy = true
    }){
      if(proxy){
        return await dummyProxy.registerParticipant(conference.address, user, { from: user, gasPrice, value:deposit });
      }else{
        return await conference.register(user, { from: user, gasPrice, value:deposit });
      }
    }
  })

  describe('on registration', function(){
    shouldBehaveLikeConference();

    it('tokenAddress is empty', async function(){
      let emptyAddress = '0x0000000000000000000000000000000000000000';
      let conference = await this.createConference({});
      await conference.tokenAddress().should.eventually.eq(emptyAddress)
    })
  })
})
