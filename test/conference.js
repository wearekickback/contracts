const { toWei } = require('web3-utils')
const EthVal = require('ethval')
const Conference = artifacts.require("./EthConference.sol");
const ConferenceTicket = artifacts.require("./ConferenceTicket.sol");

const { getBalance } = require('./utils')
const { shouldBehaveLikeConference } = require('./behaviors/conference.behavior');

web3.currentProvider.sendAsync = web3.currentProvider.send

contract('ETH Conference', function(accounts) {

  beforeEach(async function(){
    this.ct = await ConferenceTicket.new('');
    this.accounts = accounts
    this.createConference = async ({
      name = '',
      deposit = toWei('0.02', "ether"),
      limitOfParticipants = 20,
      coolingPeriod = 0,
      ownerAddress = accounts[0],
      clearFee = 10,
      ticketAddress = this.ct.address,
      gasPrice = toWei('1', 'gwei')
    }) => {
      let conference = await Conference.new(
        name,
        deposit,
        limitOfParticipants,
        coolingPeriod,
        ownerAddress,
        clearFee,
        ticketAddress
        , {gasPrice:gasPrice}
      );
      await this.ct.setConferenceAddress(conference.address);
      return conference;
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

    it('tokenAddress is empty', async function(){
      let emptyAddress = '0x0000000000000000000000000000000000000000';
      let conference = await this.createConference({});
      await conference.tokenAddress().should.eventually.eq(emptyAddress)
    })

    it('ticketAddress is set', async function(){
      let conference = await this.createConference({});
      await conference.ticketAddress().should.eventually.eq(this.ct.address)
    })

    it('ticketAddress cannot be empty', async function(){
      const emptyAddress = '0x0000000000000000000000000000000000000000'
      await this.createConference({ticketAddress:emptyAddress}).should.be.rejected;
    })
  })
})
