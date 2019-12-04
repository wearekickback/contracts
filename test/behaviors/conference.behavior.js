
const { toBN, toWei } = require('web3-utils')
const EthVal = require('ethval')
const { mulBN } = require('./../utils')
const { wait, waitUntilBlock } = require('@digix/tempo')(web3);

const emptyAddress = '0x0000000000000000000000000000000000000000'

web3.currentProvider.sendAsync = web3.currentProvider.send

const participantAttributes = ['index', 'addr', 'paid'];

const getParticipantDetail = function(participant, detail){
  return participant[participantAttributes.indexOf(detail)];
}

const assertBalanceWithDeposit = function(balance, deposit){
  balance.toFixed(9).should.eq((new EthVal(deposit)).toFixed(9))
}

function shouldBehaveLikeConference () {
  let deposit, owner, non_owner
    ,createConference, getBalance
    ,register, accounts, non_registered, admin;
  beforeEach(async function(){
    accounts = this.accounts;
    createConference = this.createConference;
    getBalance = this.getBalance;
    register = this.register;
    owner = this.accounts[0];
    non_owner = this.accounts[1];
    non_registered = this.accounts[4];
    admin = this.accounts[5];
  })

  describe('on changeName', function(){
    let conference, deposit;

    beforeEach(async function(){
      conference = await createConference({});
      deposit = await conference.deposit();
    })

    it('owner can rename the event', async function(){
      await conference.changeName('new name', {from:owner});

      await conference.name().should.eventually.eq('new name')
    })

    it('non owner cannot rename the event', async function(){
      await conference.changeName('new name', {from:non_owner}).should.be.rejected;
      await conference.name().should.not.eventually.eq('new name')
    })

    it('cannot rename the event once someone registered', async function(){
      await register({conference, deposit, user:owner});
      await conference.changeName('new name', {from:owner}).should.be.rejected;
      await conference.name().should.not.eventually.eq('new name')
    })
  })

  describe('on changeDeposit', function(){
    let newDeposit, conference, deposit;

    beforeEach(async function(){
      conference = await createConference({})
      deposit = await conference.deposit()
      newDeposit = mulBN(deposit, 2)
    })

    it('owner can change the deposit', async function(){
      await conference.changeDeposit(newDeposit, {from:owner});
      await conference.deposit().should.eventually.eq(newDeposit)
    })

    it('non owner cannot change the deposit', async function(){
      await conference.changeDeposit(newDeposit, {from:non_owner}).should.be.rejected;
      await conference.deposit().should.not.eventually.eq(newDeposit)
    })

    it('cannot change the deposit once someone registered', async function(){
      await register({conference, deposit, user:owner});
      await conference.changeDeposit(newDeposit, {from:owner}).should.be.rejected;
      await conference.deposit().should.not.eventually.eq(newDeposit)
    })
  })

  describe('on setLimitOfParticipants', function(){
    let conference, desposit;

    beforeEach(async function(){
      conference = await createConference({});
      deposit = await conference.deposit();
    })

    it('does not allow to register more than the limit', async function(){
      await conference.setLimitOfParticipants(1)
      await register({conference, deposit, user:owner});

      await conference.registered().should.eventually.eq(1)

      await register({conference, deposit, user:non_owner}).should.be.rejected;
      await conference.registered().should.eventually.eq(1)
    })

    it('does not allow to lower than already registered', async function(){
      await conference.setLimitOfParticipants(2)
      await register({conference, deposit, user:owner, owner});
      await register({conference, deposit, user:accounts[6], owner});
      await conference.registered().should.eventually.eq(2)
      await conference.setLimitOfParticipants(1).should.be.rejected;
      await conference.registered().should.eventually.eq(2)
    })
  })

  describe('on creation', function(){
    const variables = ['name', 'deposit', 'limitOfParticipants', 'coolingPeriod', 'ownerAddress'];
    variables.forEach((variable)=>{
      it(`${variable} cannot be empty`, async function(){
        const config = {};
        config[variable] = null;
        await createConference(config).should.be.rejected;
      })
    })

    it('cannot set empty address as an owner', async function(){
      await createConference({
        ownerAddress:emptyAddress
      }).should.be.rejected;
    })

    it('can set config values', async function(){
      const name = 'Test event'
      const deposit = toWei('3', 'ether')
      const limitOfParticipants = 30
      const coolingPeriod = 60

      const conference = await createConference({
        name,
        deposit,
        limitOfParticipants,
        coolingPeriod,
        ownerAddress:non_owner
      })

      await conference.name().should.eventually.eq(name)
      await conference.deposit().should.eventually.eq(deposit)
      await conference.limitOfParticipants().should.eventually.eq(limitOfParticipants)
      await conference.coolingPeriod().should.eventually.eq(coolingPeriod)
      await conference.owner().should.eventually.eq(non_owner)
    })
  })

  describe('on registration', function(){
    let beforeContractBalance, beforeAccountBalance,
        beforeOwnerBalance, conference, deposit
    beforeEach(async function(){
      conference = await createConference({});
      deposit = await conference.deposit();
      beforeContractBalance = await getBalance(conference.address)
      beforeOwnerBalance = await getBalance(owner);
      await register({conference, deposit, user:owner});
    })

    it('increments registered', async function(){
      await conference.registered().should.eventually.eq(1)
    })

    it('increases totalBalance', async function(){
      const totalBalance = await getBalance(conference.address);

      assert.equal(totalBalance.sub(beforeContractBalance).toString(10), deposit.toString(10))
    })

    it('isRegistered for the registered account is true', async function(){
      let registered = await conference.registered()
      let isRegistered = await conference.isRegistered(owner)
      registered.should.eq(1)
      isRegistered.should.eq(true)
    })

    it('isRegistered for the different account is not true', async function(){
      await conference.isRegistered(non_owner).should.eventually.eq(false)
    })
  })

  describe('on failed registration', function(){
    let conference, deposit, depositVal
    beforeEach(async function(){
      conference = await createConference({});
      deposit = await conference.deposit();
      depositVal = new EthVal(deposit);
    })

    it('cannot be registered if wrong amount of deposit is sent', async function(){
      let wrongDeposit = 5;
      let beforeContractBalance = (await getBalance(conference.address)).toEth().toFixed(9);
      await register({conference, deposit:wrongDeposit, user:owner}).should.be.rejected;
      let afterContractBalance = (await getBalance(conference.address)).toEth().toFixed(9);
      afterContractBalance.should.eq(beforeContractBalance)
      await conference.isRegistered(owner).should.eventually.eq(false)
    })

    it('cannot register twice with same address', async function(){
      await register({conference, deposit, user:owner})
      await register({conference, deposit, user:owner}).should.be.rejected;
      let afterContractBalance = (await getBalance(conference.address)).toEth().toFixed(9);;
      afterContractBalance.should.eq(depositVal.toEth().toFixed(9));
      await conference.registered().should.eventually.eq(1)
      await conference.isRegistered(owner).should.eventually.eq(true)
    })
  })

  describe('finalize using attendee bitmap', function(){
    let conference, deposit, depositVal;

    beforeEach(async function(){
      conference = await createConference({});
      deposit = await conference.deposit();
      depositVal = new EthVal(deposit);

      await register({conference, deposit, user:non_owner,   owner});
      await register({conference, deposit, user:accounts[6], owner});
      await register({conference, deposit, user:accounts[7], owner});
      await register({conference, deposit, user:accounts[8], owner});
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

    it('does not allow finalising with more attendees than registered', async function() {
      // all attended
      let n = toBN(0)
      for (let i = 0; i < 256; i++) {
        n = n.bincn(i)
      }
      await conference.finalize([n], {from:owner}).should.be.rejected;

      await conference.totalAttended().should.eventually.eq(0)
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

      register({conference, deposit, user:accounts[9]}).should.be.rejected;
    })

    it('can withdraw winning payout once finalized', async function() {
      // all attended except accounts[6]
      // 1 0 1 1
      // reverse order since we go from right to left in bit parsing:
      // [ 13 (1101) ]

      await conference.finalize([13], {from:owner});
      const previousBalance = await getBalance(non_owner);
      const previousContractBalance = await getBalance(conference.address)
      previousContractBalance.toString().should.eq( (depositVal * 4).toString() )
      await conference.withdraw({ from: non_owner });
      const diff = new EthVal(await getBalance(non_owner)).sub(previousBalance)
      assert.isOk(diff.toEth().toFixed(9) === depositVal.mul(4).div(3).toEth().toFixed(9) )
      const newContractBalance = new EthVal(await getBalance(conference.address))
      newContractBalance.toEth().toFixed(9).should.eq( previousContractBalance.sub(diff).toEth().toFixed(9) )
      const participant = await conference.participants(non_owner);
      assert.equal(getParticipantDetail(participant, 'paid'), true);
      await conference.isPaid(non_owner).should.eventually.eq(true)
    })
  })

  describe('empty events', function(){
    let conference, deposit;

    beforeEach(async function(){
      conference = await createConference({});
      deposit = await conference.deposit();
    })

    it('nothing to withdraw if no one registered', async function(){
      await conference.finalize([], { from: owner });
      await conference.ended().should.eventually.eq(true);
      await conference.payoutAmount().should.eventually.eq(0);
      await conference.withdraw({ from: owner }).should.be.rejected;
    })

    it('nothing to withdraw if no one showed up', async function(){
      await register({conference, deposit, user:owner, owner});
      await conference.finalize([0], { from: owner });
      await conference.ended().should.eventually.eq(true);
      await conference.payoutAmount().should.eventually.eq(0);
      await conference.withdraw({ from: owner }).should.be.rejected;
    })
  })

  describe('on cancel', function(){
    let previousBalance, currentRegistered, diff, participant;
    let conference, deposit, attended, notRegistered, notAttended;

    beforeEach(async function(){
      attended = accounts[2];
      notAttended = accounts[3];
      notRegistered = accounts[4];
      conference = await createConference({});
      deposit = await conference.deposit();
      await register({conference, deposit, user:attended, owner});
      await register({conference, deposit, user:notAttended, owner});
    })

    it('cannot cancel if non owner calls', async function(){
      await conference.cancel({from:non_owner}).should.be.rejected;
      await conference.withdraw({from:attended}).should.be.rejected;
      // money is still left on contract
      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 2))
    })

    it('everybody receives refund', async function(){
      await conference.cancel();
      // attended
      previousBalance = await getBalance(attended);
      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 2))
      await conference.withdraw({from:attended});
      assertBalanceWithDeposit((await getBalance(conference.address)), deposit)
      diff = (await getBalance(attended)).sub(previousBalance)
      assert.isOk(diff.gt( mulBN(deposit, 0.9) ))
      participant = await conference.participants(attended);
      assert.equal(getParticipantDetail(participant, 'paid'), true);
      // notAttended
      previousBalance = await getBalance(notAttended);
      await conference.withdraw({from:notAttended});
      assertBalanceWithDeposit((await getBalance(conference.address)), 0)
      diff = (await getBalance(notAttended)).sub(previousBalance)
      assert.isOk(diff.gt( mulBN(deposit, 0.9) ))
      participant = await conference.participants(notAttended);
      assert.equal(getParticipantDetail(participant, 'paid'), true);
    })

    it('cannot register any more', async function(){
      await conference.cancel();
      currentRegistered = await conference.registered();

      await register({conference, deposit, user:notRegistered, owner}).should.be.rejected;
      await conference.registered().should.eventually.eq(currentRegistered)
      await conference.ended().should.eventually.eq(true)
    })
    // - cannot attend any more
    // - cannot payback any more

    it('cannot be canceled if the event is already ended', async function(){
      await conference.finalize([1], { from: owner });
      await conference.cancel().should.be.rejected;

      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 2))
      await conference.withdraw({from:notAttended}).should.be.rejected;

      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 2))
      await conference.withdraw({from:attended});

      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 0))

      await conference.ended().should.eventually.eq(true)
    })
  })

  describe('on withdraw', function(){
    let conference, deposit, registered, notRegistered
    beforeEach(async function(){
      conference = await createConference({});
      deposit = await conference.deposit();
      registered = accounts[1];
      notRegistered = accounts[2];

      await register({conference, deposit, user:owner, owner});
      await register({conference, deposit, user:registered, owner});

      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 2))
    })

    it('cannot withdraw twice', async function(){
      await conference.cancel({from:owner});
      await conference.withdraw({from:registered});
      await conference.withdraw({from:registered}).should.be.rejected;
      // only 1 ether is taken out
      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 1))
    })

    it('cannot withdraw if you did not register', async function(){
      await conference.cancel({from:owner});
      await conference.withdraw({from:notRegistered}).should.be.rejected;

      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 2))
    })

    it('cannot withdraw until finalized', async function(){
      await conference.withdraw({from:registered}).should.be.rejected;
      await conference.finalize([3], { from: owner });
      await conference.withdraw({from:registered});
    })
  })

  describe('on send and withdraw', function(){
    let conference, deposit, registered, donation;
    beforeEach(async function(){
      conference = await createConference({});
      deposit = await conference.deposit(); // should be 0.02 ether (2*10e16 wei)
      registered = accounts[1];
      donation = toWei('0.01', "ether");

      await register({conference, deposit, user:owner, owner});
      await register({conference, deposit, user:registered, owner});

      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 2))
    })

    it('should take only `deposit` value', async function() {
      await conference.cancel({from:owner});
      await conference.sendAndWithdraw([accounts[2]], [donation], {from:registered});
      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 1))
    })

    it('more addresses than values or viceversa', async function(){
      await conference.cancel({from:owner});
      await conference.sendAndWithdraw([accounts[2]], [donation, donation], {from:registered}).should.be.rejected;
      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 2))
    })

    it('payout amount is less than sum of values', async function(){
      await conference.cancel({from:owner});
      await conference.sendAndWithdraw([accounts[2]], [toWei('1', "ether")], {from:registered}).should.be.rejected;
      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 2))
    })

    it('send and withdraw with empty arrays should send funds to sender', async function(){
      await conference.cancel({from:owner});

      let previousBalance = await getBalance(registered);

      await conference.sendAndWithdraw([], [], {from:registered});
      
      let diff = (await getBalance(registered)).sub(previousBalance);
      assert.isOk(diff.gt( mulBN(deposit, 0.9) ))

      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 1))
    })

    it('splits correctly', async function(){
      await conference.cancel({from:owner});

      let previousBalanceOne = await getBalance(accounts[10]);
      let previousBalanceTwo = await getBalance(accounts[20]);

      await conference.sendAndWithdraw([accounts[10], accounts[20]], [donation, donation], {from:registered});
      
      let diffOne = (await getBalance(accounts[10])).sub(previousBalanceOne);
      let diffTwo = (await getBalance(accounts[20])).sub(previousBalanceTwo);
      
      assert.isOk(diffOne.eq(donation));
      assert.isOk(diffTwo.eq(donation));

      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 1))
    })

  })

  describe('on clear', function(){
    let conference, deposit, registered, notRegistered
    beforeEach(async function(){
      conference = await createConference({coolingPeriod:10});
      deposit = await conference.deposit();
      // registered = accounts[1];
      // notRegistered = accounts[2];

      // await register({conference, deposit, user:owner, owner});
      // await register({conference, deposit, user:registered, owner});

      // assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 2))
    })

    it('cooling period can be set', async function(){
      await conference.coolingPeriod().should.eventually.eq(10)
    })

    it('cannot be cleared by non owner', async function(){

      await register({conference, deposit, user:owner, owner});
      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 1))
      await conference.clear({from:non_owner}).should.be.rejected;

      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 1))
    })

    it('cannot be cleared if event is not ended', async function(){
      await register({conference, deposit, user:owner, owner});
      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 1))
      await conference.clear({from:owner}).should.be.rejected;

      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 1))
    })

    it('cannot be cleared if cooling period is not passed', async function(){
      await register({conference, deposit, user:owner, owner});
      await conference.cancel({from:owner});

      await conference.ended().should.eventually.eq(true)
      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 1))

      await conference.clear({from:owner}).should.be.rejected;

      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 1))
    })

    it('owner receives the remaining if cooling period is passed', async function(){
      conference = await createConference({coolingPeriod:0});
      deposit = await conference.deposit();

      await register({conference, deposit, user:owner, owner});
      await conference.cancel({from:owner});

      await conference.ended().should.eventually.eq(true)
      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 1))

      let previousBalance = await getBalance(owner);
      await wait(20, 1);
      await conference.clear({from:owner});

      let diff = (await getBalance(owner)).sub(previousBalance)
      assert.isOk(diff.gt( mulBN(deposit, 0.9) ))

      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 0))
    })
  })
};

module.exports = {
  shouldBehaveLikeConference
};