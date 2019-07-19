const { toWei, toHex, toBN } = require('web3-utils')
const Conference = artifacts.require("ERC20Conference.sol");
const Token = artifacts.require("MyToken.sol");

const { getBalance, mulBN } = require('./utils')

web3.currentProvider.sendAsync = web3.currentProvider.send
const { wait, waitUntilBlock } = require('@digix/tempo')(web3);

const twitterHandle = '@bighero6';
const gas = 1000000;
const gasPrice = 1;
const participantAttributes = ['index', 'addr', 'paid'];

const getParticipantDetail = function(participant, detail){
  return participant[participantAttributes.indexOf(detail)];
}

const register = async function(token, conference, deposit, user, owner){
    if(owner){
      token.transfer(user, deposit, {from:owner})
    }
    await token.approve(conference.address, deposit, { from: user });
    await conference.register({ from: user });
    return true;
}

contract('Conference', function(accounts) {
  const owner = accounts[0];
  const non_owner = accounts[1];
  let conference, deposit, token;

  beforeEach(async function(){
    token = await Token.new();
    conference = await Conference.new('', 10, 0, 0, '0x0000000000000000000000000000000000000000', token.address);
    deposit = await conference.deposit();
  })

  describe('on registration', function(){
    let beforeContractBalance, beforeAccountBalance, beforeOwnerBalance;

    beforeEach(async function(){
      beforeContractBalance = await await conference.totalBalance();
      beforeOwnerBalance = await token.balanceOf(owner);
      await register(token, conference, deposit, owner);
    })

    it('increments registered', async function(){
      await conference.registered().should.eventually.eq(1)
    })

    it('increases totalBalance', async function(){
      const totalBalance = await conference.totalBalance()

      assert.equal(totalBalance.sub(beforeContractBalance).toString(10), deposit.toString(10))
    })

    it('isRegistered for the registered account is true', async function(){
      await conference.registered().should.eventually.eq(1)

      await conference.isRegistered(owner).should.eventually.eq(true)
    })

    it('isRegistered for the different account is not true', async function(){
      await conference.isRegistered(non_owner).should.eventually.eq(false)
    })
  })

  describe('finalize using attendee bitmap', function(){
    let non_registered = accounts[4];
    let admin = accounts[5];

    beforeEach(async function(){
      await register(token, conference, deposit, non_owner,   owner);
      await register(token, conference, deposit, accounts[6], owner);
      await register(token, conference, deposit, accounts[7], owner);
      await register(token, conference, deposit, accounts[8], owner);
    })

    it('can be called by owner', async function(){
      // first registrant attended:
      // 1 0 0 0 0
      // reverse order since we go from right to left in bit parsing:
      // [ ...0001 (1) ]
      await conference.finalize([1], {from:owner});

      await conference.isAttended(non_owner).should.eventually.eq(true)
      await conference.totalAttended().should.eventually.eq(1)
    })

    it('can be called by admin', async function(){
      await conference.grant([admin], {from:owner});
      await conference.finalize([1], {from:admin});

      await conference.isAttended(non_owner).should.eventually.eq(true)
      await conference.totalAttended().should.eventually.eq(1)
    })

    it('cannot be called by non owner', async function(){
      await conference.finalize([1], {from:non_owner}).should.be.rejected;

      await conference.isAttended(non_owner).should.eventually.eq(false)
      await conference.totalAttended().should.eventually.eq(0)
    })

    it('isAttended is false if attended function for the account is not called', async function(){
      await conference.isAttended(owner).should.eventually.eq(false)
    })

    it('cannot be called twice', async function(){
      await conference.finalize([1], {from:owner});
      await conference.finalize([1], {from:owner}).should.be.rejected;

      await conference.isAttended(non_owner).should.eventually.eq(true)
      await conference.totalAttended().should.eventually.eq(1)
    })

    it('marks party as ended and enables payout', async function() {
      await conference.finalize([1], {from:owner});

      await conference.ended().should.eventually.eq(true)
      await conference.payoutAmount().should.eventually.eq(mulBN(deposit, 4))
    })

    it('correctly calculates total attended even if more 1 bits are set than there are registrations', async function() {
      // all attended
      let n = toBN(0)
      for (let i = 0; i < 256; i++) {
        n = n.bincn(i)
      }
      await conference.finalize([n], {from:owner});

      await conference.totalAttended().should.eventually.eq(4)
    })

    it('correctly updates attendee records', async function() {
      // all attended except accounts[6]
      // 1 0 1 1
      // reverse order since we go from right to left in bit parsing:
      // [ 13 (1101) ]

      await conference.finalize([13], {from:owner});

      await conference.isAttended(non_owner).should.eventually.eq(true)
      await conference.isAttended(accounts[6]).should.eventually.eq(false)
      await conference.isAttended(accounts[7]).should.eventually.eq(true)
      await conference.isAttended(accounts[8]).should.eventually.eq(true)
      await conference.totalAttended().should.eventually.eq(3)
    })

    it('only allows those who have attended to withdraw', async function() {
      // all attended except accounts[6]
      // 1 0 1 1
      // reverse order since we go from right to left in bit parsing:
      // [ 13 (1101) ]

      await conference.finalize([13], {from:owner});

      await conference.withdraw({ from: non_owner });
      await conference.withdraw({ from: accounts[7] });
      await conference.withdraw({ from: accounts[8] });
      await conference.withdraw({ from: accounts[6] }).should.be.rejected;
    })

    it('cannot register once finalized', async function() {
      await conference.finalize([13], {from:owner});

      await conference.register({ from: accounts[9] }).should.be.rejected;
    })

    it('can withdraw winning payout once finalized', async function() {
      // all attended except accounts[6]
      // 1 0 1 1
      // reverse order since we go from right to left in bit parsing:
      // [ 13 (1101) ]

      await conference.finalize([13], {from:owner});

      const depositVal = deposit;

      const previousBalance = await token.balanceOf(non_owner);
      const previousContractBalance = await token.balanceOf(conference.address)
      previousContractBalance.toString().should.eq( (depositVal * 4).toString() )

      await conference.withdraw({ from: non_owner });
      const afterBalance = await token.balanceOf(non_owner);
      const diff = afterBalance - previousBalance;
      // TODO: think about how to handle float values
      const payout = parseInt(depositVal * 4 / 3).toFixed(9);
      assert.isOk(diff.toFixed(9) === payout );

      const newContractBalance = await token.balanceOf(conference.address);
      newContractBalance.should.eq( (previousContractBalance - diff) )

      const participant = await conference.participants(non_owner);
      assert.equal(getParticipantDetail(participant, 'paid'), true);

      await conference.isPaid(non_owner).should.eventually.eq(true)
    })
  })
})