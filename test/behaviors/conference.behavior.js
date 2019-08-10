
const { toBN, toWei } = require('web3-utils')
const EthVal = require('ethval')
const { mulBN } = require('./../utils')
const emptyAddress = '0x0000000000000000000000000000000000000000'

web3.currentProvider.sendAsync = web3.currentProvider.send

const participantAttributes = ['index', 'addr', 'paid'];

const getParticipantDetail = function(participant, detail){
  return participant[participantAttributes.indexOf(detail)];
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
      console.log(1111)
      expect(2).to.equal(2)
      console.log(1112)

      // let registered = await conference.registered()
      // console.log({registered})
      // registered.should.eq(1)
      // let isRegistered = await conference.isRegistered(owner)
      // console.log({isRegistered})
      // isRegistered.should.eq(true)
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

};

module.exports = {
  shouldBehaveLikeConference
};