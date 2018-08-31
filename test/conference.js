const { toWei, toHex, toBN } = require('web3-utils')
const Conference = artifacts.require("Conference.sol");
const Tempo = require('@digix/tempo');
const { wait, waitUntilBlock } = require('@digix/tempo')(web3);

const { getBalance } = require('./utils')

const twitterHandle = '@bighero6';
const gas = 1000000;
const gasPrice = 1;
const participantAttributes = ['participantName', 'addr', 'attended', 'paid'];

const getParticipantDetail = function(participant, detail){
  return participant[participantAttributes.indexOf(detail)];
}

contract('Conference', function(accounts) {
  const owner = accounts[0];
  const non_owner = accounts[1];
  let conference, deposit;

  beforeEach(async function(){
    conference = await Conference.new('', 0, 0, 0, '', '0x0');
    deposit = await conference.deposit();
  })

  describe('can override owner', function() {
    it('unless given address is empty', async () => {
      conference = await Conference.new('', 0, 0, 0, '', '0x0');

      await conference.owner().should.eventually.eq(owner)
    })

    it('if given address is valid', async () => {
      conference = await Conference.new('', 0, 0, 0, '', non_owner);

      await conference.owner().should.eventually.eq(non_owner)

      await conference.changeName('new name', { from:owner }).should.be.rejected;

      await conference.name().should.not.eventually.eq('new name')
    })
  })

  describe('on changeName', function(){
    it('owner can rename the event', async function(){
      await conference.changeName('new name', {from:owner});

      await conference.name().should.eventually.eq('new name')
    })

    it('non owner cannot rename the event', async function(){
      await conference.changeName('new name', {from:non_owner}).should.be.rejected;

      await conference.name().should.not.eventually.eq('new name')
    })

    it('cannot rename the event once someone registered', async function(){
      await conference.register(twitterHandle, {value:deposit});
      await conference.changeName('new name', {from:owner}).should.be.rejected;

      await conference.name().should.not.eventually.eq('new name')
    })
  })

  describe('on setLimitOfParticipants', function(){
    it('does not allow to register more than the limit', async function(){
      await conference.setLimitOfParticipants(1)
      await conference.register(twitterHandle, {value:deposit});

      await conference.registered().should.eventually.eq(1)

      await conference.register('anotherName', {from: non_owner, value:deposit}).should.be.rejected;

      await conference.registered().should.eventually.eq(1)
    })

    it('returns only your deposit for multiple invalidations', async function(){
      await conference.setLimitOfParticipants(2);
      await conference.register(twitterHandle, {value:deposit});
      await conference.register('anotherName', {from: accounts[1], value:deposit});

      await conference.registered().should.eventually.eq(2)

      const invalidTransaction = deposit.div(toBN(2))
      const beforeAccountBalance = await getBalance(accounts[2])

      // Over capacity as well as wrong deposit value.
      await conference.register('anotherName', {from: accounts[2], value:invalidTransaction}).should.be.rejected;

      await conference.registered().should.eventually.eq(2)

      await getBalance(conference.address).should.eventually.eq(deposit.mul(toBN(2)))

      // does not become exactly equal because it loses some gas.
      const afterAccountBalance = await getBalance(accounts[2])
      assert.isOk(beforeAccountBalance.gt(afterAccountBalance))
    })
  })

  describe('on creation', function(){
    it('has default values', async function(){
      await conference.name().should.eventually.eq('Test')
      await conference.deposit().should.eventually.eq(toWei('0.02', "ether"))
      await conference.limitOfParticipants().should.eventually.eq(20)
      await conference.registered().should.eventually.eq(0)
      await conference.attended().should.eventually.eq(0)
      await conference.totalBalance().should.eventually.eq(0)
    })

    it('can set config values', async function(){
      conference = await Conference.new('Test 1', parseInt(toWei('2', "ether")), 100, 2, 'public key', '0x0');

      await conference.name().should.eventually.eq('Test 1')
      await conference.deposit().should.eventually.eq(toWei('2', "ether"))
      await conference.limitOfParticipants().should.eventually.eq(100)
    })
  })

  describe('on registration', function(){
    let beforeContractBalance, beforeAccountBalance;

    beforeEach(async function(){
      beforeContractBalance = await getBalance(conference.address);

      await conference.register(twitterHandle, {value:deposit});
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

  describe('on failed registration', function(){
    it('cannot be registered if wrong amount of deposit is sent', async function(){
      let wrongDeposit = 5;
      let beforeContractBalance = await getBalance(conference.address);

      await conference.register(twitterHandle, {from:owner, value:wrongDeposit}).should.be.rejected;

      await getBalance(conference.address).should.eventually.eq(beforeContractBalance)
      await conference.isRegistered(owner).should.eventually.eq(false)
    })

    it('cannot register twice with same address', async function(){
      await conference.register(twitterHandle, {from:owner, value:deposit});
      await conference.register(twitterHandle, {from:owner, value:deposit}).should.be.rejected;

      await getBalance(conference.address).should.eventually.eq(deposit)

      await conference.registered().should.eventually.eq(1)
      await conference.isRegistered(owner).should.eventually.eq(true)
    })
  })

  // describe('on attend', function(){
  //   let non_registered = accounts[4];
  //   let admin = accounts[5];
  //
  //   beforeEach(async function(){
  //     await conference.register(twitterHandle, {value:deposit, from:non_owner});
  //   })
  //
  //   it('can be called by owner', async function(){
  //     await conference.attend([non_owner], {from:owner});
  //     assert.equal(await conference.isAttended.call(non_owner), true);
  //     assert.equal((await conference.attended()).toNumber(), 1);
  //   })
  //
  //   it('can be called by admin', async function(){
  //     await conference.grant([admin], {from:owner});
  //     await conference.attend([non_owner], {from:admin});
  //     assert.equal(await conference.isAttended.call(non_owner), true);
  //     assert.equal((await conference.attended()).toNumber(), 1);
  //   })
  //
  //   it('cannot be called by non owner', async function(){
  //     await conference.attend([non_owner], {from:non_owner}).should.be.rejected;
  //     assert.equal(await conference.isAttended.call(non_owner), false);
  //     assert.equal(await conference.attended(), 0);
  //     let participant = await conference.participants.call(non_owner);
  //     assert.equal(getParticipantDetail(participant, 'attended'), false);
  //   })
  //
  //   it('isAttended is false if attended function for the account is not called', async function(){
  //     assert.equal(await conference.isAttended.call(owner), false);
  //   })
  //
  //   it('cannot be attended if the list includes non registered address', async function(){
  //     await conference.attend([non_owner, non_registered], {from:owner}).should.be.rejected;
  //     assert.equal(await conference.isAttended.call(non_owner), false);
  //     assert.equal(await conference.isAttended.call(non_registered), false);
  //     assert.equal((await conference.attended()).toNumber(), 0);
  //   })
  //
  //   it('cannot be attended twice', async function(){
  //     await conference.attend([non_owner], {from:owner});
  //     await conference.attend([non_owner], {from:owner}).should.be.rejected;
  //     assert.equal(await conference.isAttended.call(non_owner), true);
  //     assert.equal((await conference.attended()).toNumber(), 1);
  //   })
  // })
  //
  // describe('on empty event', function(){
  //   let notAttended = accounts[3];
  //
  //   it('nothing to withdraw if no one attend', async function(){
  //     await conference.payback({from:owner});
  //     assert.equal(await conference.payoutAmount(), 0);
  //   })
  // })
  //
  // describe('on payback', function(){
  //   let previousBalance, currentRegistered, currentAttended;
  //   let attended = accounts[2];
  //   let notAttended = accounts[3];
  //   let notRegistered = accounts[4];
  //
  //   beforeEach(async function(){
  //     await conference.register(twitterHandle, {from:attended, value:deposit});
  //     await conference.register(twitterHandle, {from:notAttended, value:deposit});
  //     await conference.attend([attended]);
  //   })
  //
  //   it('cannot withdraw if non owner calls', async function(){
  //     await conference.payback({from:non_owner}).should.be.rejected;
  //     await conference.withdraw({from:attended}).should.be.rejected;
  //     // money is still left on contract
  //     assert.strictEqual(getBalance(conference.address).toNumber(), deposit.mul(2);
  //     assert.equal(await conference.isPaid.call(attended), false);
  //   })
  //
  //   it('cannot withdraw if you did not attend', async function(){
  //     await conference.payback({from:owner});
  //     await conference.withdraw({from:notAttended}).should.be.rejected;
  //     // money is still left on contract
  //     assert.strictEqual(getBalance(conference.address).toNumber(), deposit.mul(2);
  //     assert.equal(await conference.isPaid.call(notAttended), false);
  //   })
  //
  //   it('can withdraw if you attend', async function(){
  //     await conference.payback({from:owner});
  //     previousBalance = getBalance(attended);
  //     assert.strictEqual(getBalance(conference.address).toNumber(), deposit.mul(2);
  //     await conference.withdraw({from:attended});
  //     assert.strictEqual(getBalance(conference.address).toNumber(), 0);
  //     let diff = getBalance(attended).toNumber() - previousBalance.toNumber();
  //     assert( diff > (deposit * 1.9));
  //     let participant = await conference.participants.call(attended);
  //     assert.equal(getParticipantDetail(participant, 'paid'), true);
  //     assert.equal(await conference.isPaid.call(attended), true);
  //   })
  //
  //   it('cannot register any more', async function(){
  //     await conference.payback({from:owner});
  //     currentRegistered = await conference.registered();
  //     await conference.register('some handler', {from:notRegistered, value:deposit}).should.be.rejected;
  //     assert.strictEqual((await conference.registered()).toNumber(), currentRegistered.toNumber());
  //     assert.equal(await conference.ended(), true);
  //   })
  //
  //   // This is faiing. Potentially bug;
  //   it('cannot attend any more', async function(){
  //     await conference.payback({from:owner});
  //     currentAttended = await conference.attended();
  //     await conference.attend([notAttended], {from:owner}).should.be.rejected;
  //     assert.strictEqual((await conference.attended()).toNumber(), currentAttended.toNumber());
  //     assert.equal(await conference.ended(), true);
  //   })
  // })
  //
  // describe('on cancel', function(){
  //   let previousBalance, currentRegistered, currentAttended, diff, participant;
  //   let attended = accounts[2];
  //   let notAttended = accounts[3];
  //   let notRegistered = accounts[4];
  //
  //   beforeEach(async function(){
  //     await conference.register(twitterHandle, {from:attended, value:deposit});
  //     await conference.register(twitterHandle, {from:notAttended, value:deposit});
  //     await conference.attend([attended]);
  //   })
  //
  //   it('cannot cancel if non owner calls', async function(){
  //     await conference.cancel({from:non_owner}).should.be.rejected;
  //     await conference.withdraw({from:attended}).should.be.rejected;
  //     // money is still left on contract
  //     assert.strictEqual(getBalance(conference.address).toNumber(), deposit.mul(2);
  //   })
  //
  //   it('everybody receives refund', async function(){
  //     await conference.cancel();
  //     // attended
  //     previousBalance = getBalance(attended);
  //     assert.strictEqual(getBalance(conference.address).toNumber(), deposit.mul(2);
  //     await conference.withdraw({from:attended});
  //     assert.strictEqual(getBalance(conference.address).toNumber(), deposit);
  //     diff = getBalance(attended).toNumber() - previousBalance.toNumber();
  //     assert( diff > (deposit * 0.9));
  //     participant = await conference.participants.call(attended);
  //     assert.equal(getParticipantDetail(participant, 'paid'), true);
  //     // notAttended
  //     previousBalance = getBalance(notAttended);
  //     await conference.withdraw({from:notAttended});
  //     assert.strictEqual(getBalance(conference.address).toNumber(), 0);
  //     diff = getBalance(notAttended).toNumber() - previousBalance.toNumber();
  //     assert( diff > (deposit * 0.9));
  //     participant = await conference.participants.call(notAttended);
  //     assert.equal(getParticipantDetail(participant, 'paid'), true);
  //   })
  //
  //   it('cannot register any more', async function(){
  //     await conference.cancel();
  //     currentRegistered = await conference.registered();
  //     await conference.register('some handler', {from:notRegistered, value:deposit}).should.be.rejected;
  //     assert.strictEqual((await conference.registered()).toNumber(), currentRegistered.toNumber());
  //     assert.equal(await conference.ended(), true);
  //   })
  //   // - cannot attend any more
  //   // - cannot payback any more
  //
  //   it('cannot be canceled if the event is already ended', async function(){
  //     await conference.payback();
  //     await conference.cancel().should.be.rejected;
  //     assert.strictEqual(getBalance(conference.address).toNumber(), deposit.mul(2);
  //     await conference.withdraw({from:notAttended}).should.be.rejected;
  //     assert.strictEqual(getBalance(conference.address).toNumber(), deposit.mul(2);
  //     await conference.withdraw({from:attended});
  //     assert.strictEqual(getBalance(conference.address).toNumber(), 0);
  //     assert.equal(await conference.ended(), true)
  //   })
  // })
  //
  // describe('on withdraw', function(){
  //   let registered = accounts[1];
  //   let notRegistered = accounts[2];
  //
  //   beforeEach(async function(){
  //     await conference.register(twitterHandle, {from:owner, value:deposit});
  //     await conference.register(twitterHandle, {from:registered, value:deposit});
  //     assert.strictEqual( getBalance(conference.address).toNumber(), deposit.mul(2);
  //   })
  //
  //   it('cannot withdraw twice', async function(){
  //     await conference.cancel({from:owner});
  //     await conference.withdraw({from:registered});
  //     await conference.withdraw({from:registered}).should.be.rejected;
  //     // only 1 ether is taken out
  //     assert.strictEqual(getBalance(conference.address).toNumber(), deposit);
  //   })
  //
  //   it('cannot withdraw if you did not register', async function(){
  //     await conference.cancel({from:owner});
  //     await conference.withdraw({from:notRegistered}).should.be.rejected;
  //     assert.strictEqual(getBalance(conference.address).toNumber(), deposit.mul(2);
  //   })
  // })
  //
  // describe('on clear', function(){
  //   let one_week = 1 * 60 * 60 * 24 * 7;
  //
  //   it('default cooling period is 1 week', async function(){
  //     assert.equal((await conference.coolingPeriod()).toNumber(), one_week);
  //   })
  //
  //   it('cooling period can be set', async function(){
  //     conference = await Conference.new('', 0, 0, 10, '', '0x0');
  //     assert.equal((await conference.coolingPeriod()).toNumber(), 10);
  //   })
  //
  //   it('cannot be cleared by non owner', async function(){
  //     conference = await Conference.new('', 0, 0, 10, '', '0x0');
  //     deposit = (await conference.deposit()).toNumber();
  //     await conference.register('one', {value:deposit});
  //     assert.strictEqual(getBalance(conference.address).toNumber(), deposit);
  //     await conference.clear({from:non_owner}).should.be.rejected;
  //     assert.strictEqual(getBalance(conference.address).toNumber(), deposit);
  //   })
  //
  //   it('cannot be cleared if event is not ended', async function(){
  //     await conference.register('one', {value:deposit});
  //     assert.strictEqual(getBalance(conference.address).toNumber(), deposit);
  //     await conference.clear({from:owner}).should.be.rejected;
  //     assert.strictEqual(getBalance(conference.address).toNumber(), deposit);
  //   })
  //
  //   it('cannot be cleared if cooling period is not passed', async function(){
  //     await conference.register('one', {value:deposit});
  //     await conference.cancel({from:owner});
  //     assert.equal(await conference.ended(), true);
  //     assert.strictEqual( getBalance(conference.address).toNumber(), deposit);
  //     await conference.clear({from:owner}).should.be.rejected;
  //     assert.equal(getBalance(conference.address).toNumber(), deposit);
  //   })
  //
  //   it('owner receives the remaining if cooling period is passed', async function(){
  //     let tempo = await new Tempo(web3);
  //     conference = await Conference.new('', 0, 0, 1, '', '0x0')
  //     deposit = (await conference.deposit()).toNumber();
  //
  //     await conference.register('one', {value:deposit});
  //     await conference.cancel({from:owner});
  //     assert.equal(await conference.ended(), true);
  //     assert.strictEqual(getBalance(conference.address).toNumber(), deposit);
  //     let previousBalance = getBalance(owner);
  //     await wait(2, 1);
  //     await conference.clear({from:owner});
  //     let diff = getBalance(owner) - previousBalance.toNumber();
  //     assert( diff > (deposit * 0.9));
  //     assert.strictEqual(getBalance(conference.address).toNumber(), 0);
  //   })
  // })
})
