const { toWei } = require('web3-utils')
const EthVal = require('ethval')
const Conference = artifacts.require("./EthConference.sol");
const Deployer = artifacts.require("./Deployer.sol");

const { getBalance } = require('./utils')
const { shouldHandleLargeParty } = require('./behaviors/conferenceFinalize.behavior');

web3.currentProvider.sendAsync = web3.currentProvider.send

contract('ETH Conference - stress tests', function(accounts) {
  beforeEach(async function(){
    const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000'
    this.accounts = accounts
    deployer = await Deployer.new(
      EMPTY_ADDRESS,
      EMPTY_ADDRESS,
      0,
      ''
    )

    this.createConference = ({
      name = '',
      deposit = toWei('0.02', "ether"),
      limitOfParticipants = 20,
      coolingPeriod = 0,
      ownerAddress = accounts[0],
      clearFee = 1000,
      deployerAddress = deployer.address,
      gasPrice = toWei('1', 'gwei')
    }) => {
      return Conference.new(
        name,
        deposit,
        limitOfParticipants,
        coolingPeriod,
        ownerAddress,
        clearFee,
        deployerAddress
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

  describe('on big party', function(){
    shouldHandleLargeParty();
  })
})
