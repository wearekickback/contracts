const { toWei } = require('web3-utils')
const EthVal = require('ethval')
const Conference = artifacts.require("./EthConference.sol");
const ConferenceTicket = artifacts.require("./ConferenceTicket.sol");

const { getBalance } = require('./utils')
const { shouldHandleLargeParty } = require('./behaviors/conferenceFinalize.behavior');

web3.currentProvider.sendAsync = web3.currentProvider.send

contract('ETH Conference - stress tests', function(accounts) {

  beforeEach(async function(){
    this.ct = await ConferenceTicket.new('');
    this.accounts = accounts
    this.createConference = async ({
      name = '',
      deposit = toWei('0.02', "ether"),
      limitOfParticipants = 20,
      coolingPeriod = 0,
      ownerAddress = accounts[0],
      clearFee = 1000,
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

  describe('on big party', function(){
    shouldHandleLargeParty();
  })
})
