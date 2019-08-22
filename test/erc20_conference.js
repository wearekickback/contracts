const { toWei } = require('web3-utils')
const Conference = artifacts.require("ERC20Conference.sol");
const Token = artifacts.require("MyToken.sol");
const EthVal = require('ethval')

web3.currentProvider.sendAsync = web3.currentProvider.send

const { shouldBehaveLikeConference } = require('./behaviors/conference.behavior');

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

  shouldBehaveLikeConference();

  describe('on creation', function(){
    it('tokenAddress is not empty', async function(){
      let conference = await this.createConference({});
      await conference.tokenAddress().should.eventually.eq(token.address)
    })
  })

  describe('on registration', function(){
    it('fail if token is not approved', async function(){
      let conference = await this.createConference({});
      let user = this.accounts[1];
      await conference.register({ from: user }).should.be.rejected;
      await conference.isRegistered(user).should.eventually.eq(false)
    })
  })
})
