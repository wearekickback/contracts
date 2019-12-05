const { toWei } = require('web3-utils')
const Conference = artifacts.require("ERC20Conference.sol");
const Token = artifacts.require("MyToken.sol");
const Chai = artifacts.require("MyChai.sol");
const EthVal = require('ethval')
const { wait } = require('@digix/tempo')(web3);

web3.currentProvider.sendAsync = web3.currentProvider.send

const { shouldBehaveLikeConference } = require('./behaviors/conference.behavior');

contract('ERC20 Conference', function(accounts) {
  let token, chai;

  beforeEach(async function(){
    token = await Token.new();
    chai = await Chai.new(token.address);
    this.accounts = accounts
    this.createConference = ({
      name = '',
      deposit = toWei('0.02', "ether"),
      limitOfParticipants = 20,
      coolingPeriod = 0,
      ownerAddress = accounts[0],
      tokenAdderss = token.address,
      chaiAddress  = chai.address,
      gasPrice = toWei('1', 'gwei')
    }) => {
      return Conference.new(
        name,
        deposit,
        limitOfParticipants,
        coolingPeriod,
        ownerAddress,
        tokenAdderss,
        chaiAddress
        , {gasPrice:gasPrice}
      );
    }
    this.token = token;
    this.getBalance = async (account) => {
      return new EthVal(await token.balanceOf(account));
    }
    this.register = async function({conference, deposit, user, owner, approve = true, gasPrice = toWei('1', "gwei"), value = 0}){
      if(owner){
        token.transfer(user, deposit, {from:owner, gasPrice});
      }
      if(approve){
        await token.approve(conference.address, deposit, { from: user, gasPrice });
      }
      return await conference.register({ from: user, gasPrice, value });
    }
  })

  shouldBehaveLikeConference();

  describe('on creation', function(){
    it('tokenAddress is not empty', async function(){
      let conference = await this.createConference({});
      await conference.tokenAddress().should.eventually.eq(token.address)
    })

    it('tokenAddress cannot be empty', async function(){
      const emptyAddress = '0x0000000000000000000000000000000000000000'
      await this.createConference({tokenAdderss:emptyAddress}).should.be.rejected;
    })
  })

  describe('on registration', function(){
    let conference, owner, user, deposit;
    beforeEach(async function(){
      conference = await this.createConference({});
      owner = this.accounts[0];
      user = this.accounts[1];
      deposit = await conference.deposit();
    })

    it('fail if token is not approved', async function(){
      await this.register({conference, deposit, user, owner, approve:false}).should.be.rejected;
      await conference.isRegistered(user).should.eventually.eq(false)
    })

    it('fail if it tries to send some ETH', async function(){
      await this.register({conference, deposit, user, owner, value:1}).should.be.rejected;
      await conference.isRegistered(user).should.eventually.eq(false)
    })

    it.only('earns some interest from chai', async function(){
      await this.register({conference, deposit, user, owner})
      await conference.finalize([1], {from:owner});
      await conference.withdraw({ from: user });
      console.log(1, (new EthVal(await token.balanceOf(owner))).toFixed(9));
      await wait(20, 1);
      // const totalDaiBalance = await conference.totalDaiBalance();

      await conference.clear({from:owner})
      console.log((new EthVal(await token.balanceOf(owner))).toFixed(9));
    })
  })
})
