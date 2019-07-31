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
    this.createConference = () => {
      return Conference.new(
        '',
        toWei('0.02', "ether"),
        0,
        0,
        '0x0000000000000000000000000000000000000000',
        token.address
      );
    }
    this.getBalance = async (account) => {
      return new EthVal(await token.balanceOf(account));
    }
    this.register = async function(conference, deposit, user, owner){
      if(owner){
        token.transfer(user, deposit, {from:owner})
      }
      await token.approve(conference.address, deposit, { from: user });
      await conference.register({ from: user });
      return true;
    }
  })

  describe('on registration', function(){
    shouldBehaveLikeConference();
  })
})