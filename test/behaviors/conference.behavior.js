const { toBN, toWei } = require('web3-utils')
const EthVal = require('ethval')
const { mulBN, outputBNs } = require('./../utils')
const { wait, waitUntilBlock } = require('@digix/tempo')(web3);
const Deployer = artifacts.require("Deployer.sol")

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
    recipient = this.accounts[2];
    non_registered = this.accounts[4];
    admin = this.accounts[5];
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

  describe('after creation', function(){
    let conference;

    beforeEach(async function(){
      conference = await createConference({});
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

    it('sets the owner of the ticket', async function(){
      let registered = await conference.registered()
      await conference.ownerOf(registered).should.eventually.eq(owner)
    })

    it('owner of non-existing ticket is rejected', async function(){
      await conference.ownerOf(2).should.be.rejected
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

  describe('on transfer', function(){
    let beforeContractBalance, beforeOwnerBalance, 
        conference, deposit
    beforeEach(async function(){
      conference = await createConference({});
      deposit = await conference.deposit();
      beforeContractBalance = await getBalance(conference.address)
      beforeOwnerBalance = await getBalance(owner);
      await register({conference, deposit, user:owner});

      await conference.paused().should.eventually.eq(true)
      await conference.unpause({from:owner})
      await conference.paused().should.eventually.eq(false)
    })

    it('cannot transfer if paused', async function(){
      await conference.pause({from:owner})
      await conference.paused().should.eventually.eq(true)

      let expectedRegistered = 1
      await conference.registered().should.eventually.eq(expectedRegistered)
      await conference.isRegistered(owner).should.eventually.eq(true)
      await conference.ownerOf(expectedRegistered).should.eventually.eq(owner)

      await conference.safeTransferFrom(owner, recipient, expectedRegistered).should.be.rejected

      await conference.registered().should.eventually.eq(expectedRegistered)
      await conference.isRegistered(owner).should.eventually.eq(true)
      await conference.isRegistered(recipient).should.eventually.eq(false)
      await conference.ownerOf(expectedRegistered).should.eventually.eq(owner)
    })

    it('transfers the ticket to the new recipient', async function(){
      let expectedRegistered = 1
      await conference.registered().should.eventually.eq(expectedRegistered)
      await conference.isRegistered(owner).should.eventually.eq(true)
      await conference.ownerOf(expectedRegistered).should.eventually.eq(owner)

      await conference.safeTransferFrom(owner, recipient, expectedRegistered).should.be.fulfilled
      await conference.registered().should.eventually.eq(expectedRegistered)
      await conference.isRegistered(owner).should.eventually.eq(false)
      await conference.isRegistered(recipient).should.eventually.eq(true)
      await conference.ownerOf(expectedRegistered).should.eventually.eq(recipient)
    })

    it('allows the previous owner to register again', async function(){
      await register({conference, deposit, user:owner}).should.be.rejected
      await conference.safeTransferFrom(owner, recipient, 1).should.be.fulfilled
      await register({conference, deposit, user:owner}).should.be.fulfilled

      await conference.registered().should.eventually.eq(2)
      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 2))
    })

    it('prevents the new recipient to register again', async function(){
      await conference.safeTransferFrom(owner, recipient, 1).should.be.fulfilled
      await register({conference, deposit, user:recipient}).should.be.rejected
      await conference.registered().should.eventually.eq(1)      
    })

    it('fails if the new recipient is already registered', async function(){
      await register({conference, deposit, user:recipient, owner}).should.be.fulfilled
      await conference.safeTransferFrom(owner, recipient, 1).should.be.rejected
      await conference.registered().should.eventually.eq(2)      
    })

    it('success if owner', async function(){
      let from = owner
      let to = accounts[2]
      let tokenId = 1
      await conference.ownerOf(tokenId).should.eventually.eq(from)
      await conference.safeTransferFrom(from, to, tokenId, { from: from}).should.be.fulfilled
      await conference.ownerOf(tokenId).should.eventually.eq(to)
    })

    it('success if approved', async function(){
      let from = owner
      let to = accounts[2]
      let tokenId = 1
      await conference.approve(to, tokenId, { from: from}).should.be.fulfilled
      await conference.safeTransferFrom(from, to, tokenId, { from: to}).should.be.fulfilled
      await conference.ownerOf(tokenId).should.eventually.eq(to)
    })

    it('fail if not owner', async function(){
      let from = owner
      let to = accounts[2]
      let tokenId = 1
      await conference.safeTransferFrom(from, to, tokenId, { from: to}).should.be.rejected
      await conference.ownerOf(tokenId).should.eventually.eq(from)
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

    it('new recipient can withdraw after transfer', async function(){
      await conference.unpause();

      await conference.safeTransferFrom(registered, recipient, 2, { from: registered }).should.be.fulfilled
      await conference.finalize([3], { from: owner });
      await conference.withdraw({from:registered}).should.be.rejected;
      await conference.withdraw({from:recipient});
    })
  })

  describe('on send and withdraw', function(){
    let conference, deposit, registered, donation, donationTwo, beneficiary;
    beforeEach(async function(){
      conference = await createConference({});
      deposit = await conference.deposit(); // should be 0.02 ether (2*10e16 wei)
      registered = accounts[1];
      donation = toWei('0.013', "ether");
      donationTwo = toWei('0.004', "ether");
      beneficiary = accounts[2];
      await register({conference, deposit, user:owner, owner});
      await register({conference, deposit, user:registered, owner});

      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 2))
    })

    it('should take only `deposit` value', async function() {
      await conference.cancel({from:owner});
      let registeredBeforeBalance = await getBalance(registered)
      let beneficiaryBeforeBalance = await getBalance(beneficiary)
      await conference.sendAndWithdraw([beneficiary], [donation], {from:registered});
      let beneficiaryAfterBalance = await getBalance(beneficiary)
      let beneficiaryDiff = beneficiaryAfterBalance.sub(beneficiaryBeforeBalance)
      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 1))
      let registeredAfterBalance = await getBalance(registered)
      let registeredDiff = registeredAfterBalance.sub(registeredBeforeBalance)
      assert.isOk(beneficiaryDiff.eq( new EthVal(donation) ))
      let leftOver = new EthVal(deposit).sub(new EthVal(donation))
      assert.isOk(registeredDiff.gt(leftOver.mul(0.9)))
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
      let previousBalanceRegistered = await getBalance(registered)
      let previousBalanceOne = await getBalance(accounts[10]);
      let previousBalanceTwo = await getBalance(accounts[20]);
      await conference.sendAndWithdraw([accounts[10], accounts[20]], [donation, donationTwo], {from:registered});
      let diffRegistered = (await getBalance(registered)).sub(previousBalanceRegistered);
      let diffOne = (await getBalance(accounts[10])).sub(previousBalanceOne);
      let diffTwo = (await getBalance(accounts[20])).sub(previousBalanceTwo);
      assert.isOk(diffOne.eq(donation));
      assert.isOk(diffTwo.eq(donationTwo));
      let leftOver = new EthVal(deposit).sub(donation).sub(donationTwo)
      assert.isOk(diffRegistered.gt(mulBN(leftOver, 0.9)));
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

    it('owner receives the remaining if cooling period is passed and everyone called withdraw', async function(){
      conference = await createConference({coolingPeriod:0})
      deposit = await conference.deposit()

      await register({conference, deposit, user:accounts[10], owner})
      await register({conference, deposit, user:accounts[11], owner})
      await register({conference, deposit, user:accounts[12], owner})
      await register({conference, deposit, user:accounts[13], owner})

      const maps = [ toBN(0).bincn(1).bincn(2).bincn(3) ]
      await conference.finalize(maps, {from:owner})
      await conference.ended().should.eventually.eq(true)
      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 4))

      await wait(20, 1);
      await conference.clear({from:owner}).should.be.rejected

      await conference.withdraw({from:accounts[11]})
      await conference.withdraw({from:accounts[12]})
      await conference.withdraw({from:accounts[13]})
      assert.isOk((await getBalance(conference.address)).gt(0))
      await conference.clear({from:owner})
      assert.isOk((await getBalance(conference.address)).eq(0))
    })
  })

  describe('on clear and send', function(){
    let conference, deposit, attended, payoutAmount, clearFee, fees;

    beforeEach(async function(){
      conference = await createConference({coolingPeriod:0})
      deposit = await conference.deposit()
      
      let numRegistered = 4;
      for (let i = 0; i < numRegistered; i++) {
          await register({conference, deposit, user:accounts[10 + i], owner})
      } 

      // [ 110 ], accounts[11], accounts[12]
      const maps = [ toBN(0).bincn(1).bincn(2) ];


      await conference.finalize(maps, {from:owner});
      await conference.ended().should.eventually.eq(true)
      
      payoutAmount = new EthVal(await conference.payoutAmount());
      clearFee = await conference.clearFee();
      fees = payoutAmount.mul(clearFee).div(1000).toString(10);

      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, numRegistered))
    })

    it('fees calculation works correctly', async function(){
      let previousBalanceOne = await getBalance(accounts[11]);
      let previousBalanceTwo = await getBalance(accounts[12]);
      let previousBalanceOwner = await getBalance(owner);

      await wait(20, 1);
      await conference.clearAndSend({from:owner});

      let diffOne = new EthVal(await getBalance(accounts[11])).sub(previousBalanceOne)
      let diffTwo = new EthVal(await getBalance(accounts[12])).sub(previousBalanceTwo)
      let diffOwner = new EthVal(await getBalance(owner)).sub(previousBalanceOwner)

      assert.isOk(diffOne.eq(payoutAmount.sub(fees)))
      assert.isOk(diffTwo.eq(payoutAmount.sub(fees)))
      assert.isOk(diffOwner.gt(new EthVal(fees).mul(2).mul(0.9))) // greater than ((fees * 2) * 0.9) due to gas consumption

      assertBalanceWithDeposit((await getBalance(conference.address)), 0)
    })

    it('calling with a number of attenders', async function() {
      let previousBalanceOne = await getBalance(accounts[11]);
      let previousBalanceTwo = await getBalance(accounts[12]);

      await wait(20, 1);
      await conference.clearAndSend(1);
      
      let diffOne = new EthVal(await getBalance(accounts[11])).sub(previousBalanceOne)
      let diffTwo = new EthVal(await getBalance(accounts[12])).sub(previousBalanceTwo)
      
      assert.isOk(diffOne.eq(payoutAmount.sub(fees)))
      assert.isOk(diffTwo.lt(payoutAmount.sub(fees)))

      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(payoutAmount, 1))
    })

    it('calling with a number of attendees greater than the contract\'s one', async function() {
      let previousBalanceOne = await getBalance(accounts[11]);
      let previousBalanceTwo = await getBalance(accounts[12]);

      await wait(20, 1);
      await conference.clearAndSend(5);

      let paidOne = await conference.isPaid(accounts[11]);
      let paidTwo = await conference.isPaid(accounts[12]);
      paidOne.should.eq(true);
      paidTwo.should.eq(true);

      let diffOne = new EthVal(await getBalance(accounts[11])).sub(previousBalanceOne)
      let diffTwo = new EthVal(await getBalance(accounts[12])).sub(previousBalanceTwo)
      
      assert.isOk(diffOne.eq(payoutAmount.sub(fees)))
      assert.isOk(diffTwo.eq(payoutAmount.sub(fees)))


      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(payoutAmount, 0))
    })

    it('consecutive calls', async function() {
      let previousBalanceOne = await getBalance(accounts[11]);
      let previousBalanceTwo = await getBalance(accounts[12]);

      await wait(20, 1);
      await conference.clearAndSend(1);
      await conference.clearAndSend(1);
      await conference.clearAndSend(1).should.be.rejected;

      let diffOne = new EthVal(await getBalance(accounts[11])).sub(previousBalanceOne)
      let diffTwo = new EthVal(await getBalance(accounts[12])).sub(previousBalanceTwo)
      
      assert.isOk(diffOne.eq(payoutAmount.sub(fees)))
      assert.isOk(diffTwo.eq(payoutAmount.sub(fees)))

      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(payoutAmount, 0))
    })

    it('paid users are not refunded', async function() {
      await wait(20, 1);

      await conference.withdraw({from:accounts[11]});

      let previousBalanceOne = await getBalance(accounts[11]);
      let previousBalanceTwo = await getBalance(accounts[12]);
      await conference.clearAndSend();

      let diffOne = new EthVal(await getBalance(accounts[11])).sub(previousBalanceOne)
      let diffTwo = new EthVal(await getBalance(accounts[12])).sub(previousBalanceTwo)
      
      assert.isOk(diffOne.eq(0))
      assert.isOk(diffTwo.eq(payoutAmount.sub(fees)))

      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(payoutAmount, 0))
    })

    it('users can\'t withdraw after clear and send is called', async function() {
      await wait(20, 1);
      let previousBalanceOne = await getBalance(accounts[11]);
      await conference.clearAndSend();
      await conference.withdraw({from:accounts[11]}).should.be.rejected;
      let diffOne = new EthVal(await getBalance(accounts[11])).sub(previousBalanceOne)
      assert.isOk(diffOne.lte(payoutAmount.sub(fees))) // for eth: due to gas
      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(payoutAmount, 0))
    })

    it('user can withdraw even after clearAndSend is called as long as the user is not withdrawn', async function() {
      await wait(20, 1);
      let previousBalanceOne = await getBalance(accounts[11]);
      let previousBalanceTwo = await getBalance(accounts[12]);

      await conference.clearAndSend(1);
      await conference.withdraw({from:accounts[11]}).should.be.rejected;

      let paidOne = await conference.isPaid(accounts[11]);
      let paidTwo = await conference.isPaid(accounts[12]);
      paidOne.should.eq(true);
      paidTwo.should.eq(false);

      await conference.withdraw({from:accounts[12]});
      
      let diffOne = new EthVal(await getBalance(accounts[11])).sub(previousBalanceOne)
      let diffTwo = new EthVal(await getBalance(accounts[12])).sub(previousBalanceTwo)
      assert.isOk(diffOne.lte(payoutAmount.sub(fees))) // for eth: due to gas
      assert.isOk(diffTwo.gt(payoutAmount.mul(0.9))) // for eth: due to gas
      
      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(payoutAmount, 0))
    })

  })

  describe('on clear and send + transfer', function(){
    let conference, deposit, attended, payoutAmount, clearFee, fees;

    beforeEach(async function(){
      conference = await createConference({coolingPeriod:0})
      await conference.unpause()

      deposit = await conference.deposit()

      let numRegistered = 4;
      for (let i = 0; i < numRegistered; i++) {
          await register({conference, deposit, user:accounts[10 + i], owner})
      }

      await conference.ownerOf(3).should.eventually.eq(accounts[12])
      await conference.safeTransferFrom(accounts[12], recipient, 3, {from:accounts[12]})
      await conference.ownerOf(3).should.eventually.eq(recipient)
      await conference.isAttended(recipient).should.eventually.eq(false)
      await conference.isPaid(recipient).should.eventually.eq(false)      

      const maps = [ toBN(0).bincn(1).bincn(2) ];

      await conference.finalize(maps, {from:owner});
      await conference.ended().should.eventually.eq(true)
      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, 4))

      payoutAmount = new EthVal(await conference.payoutAmount());
      clearFee = await conference.clearFee();
      fees = payoutAmount.mul(clearFee).div(1000).toString(10);

      assertBalanceWithDeposit((await getBalance(conference.address)), mulBN(deposit, numRegistered))
    })

    it('fees calculation works correctly', async function(){
      let previousBalanceOne = await getBalance(accounts[11]);
      let previousBalanceTwo = await getBalance(accounts[12]);
      let previousBalanceOwner = await getBalance(owner);
      let previousBalanceRecipient = await getBalance(recipient);

      await wait(20, 1);
      await conference.clearAndSend({from:owner});

      let diffOne = new EthVal(await getBalance(accounts[11])).sub(previousBalanceOne)
      let diffTwo = new EthVal(await getBalance(accounts[12])).sub(previousBalanceTwo)
      let diffOwner = new EthVal(await getBalance(owner)).sub(previousBalanceOwner)
      let diffRecipient = new EthVal(await getBalance(recipient)).sub(previousBalanceRecipient)

      assert.isOk(diffOne.eq(payoutAmount.sub(fees)))
      assert.isOk(diffTwo.eq(0))
      assert.isOk(diffOwner.gt(new EthVal(fees).mul(2).mul(0.9))) // greater than ((fees * 2) * 0.9) due to gas consumption
      assert.isOk(diffRecipient.eq(payoutAmount.sub(fees)))

      assertBalanceWithDeposit((await getBalance(conference.address)), 0)

      await conference.isAttended(recipient).should.eventually.eq(true)
      await conference.isPaid(recipient).should.eventually.eq(true)
    })

  })

};

module.exports = {
  shouldBehaveLikeConference
};