
const { toBN } = require('web3-utils')
const { outputBNs } = require('../utils')
const { calculateFinalizeMaps } = require('@wearekickback/shared')
web3.currentProvider.sendAsync = web3.currentProvider.send

function shouldHandleLargeParty () {
  let conference, deposit, owner
    ,createConference, getBalance
    ,register, accounts;

  beforeEach(async function(){
    accounts = this.accounts;
    createConference = this.createConference;
    getBalance = this.getBalance;
    register = this.register;
    owner = this.accounts[0];
  })

  describe('finalize large party using attendee bitmaps', function(){
    const numRegistered = 300
    let createConferenceAndRegisterParticipants

    beforeEach(async function(){
      createConferenceAndRegisterParticipants = async () => {
        conference = await createConference({
          limitOfParticipants:500,
          ownerAddress:accounts[0]
        });
        deposit = await conference.deposit();

        for (let i = 0; i < numRegistered; ++i) {
          await register({conference, deposit, user:accounts[10 + i], owner})
        }
      }
    })

    it('requires valid input to succeed', async () => {
      await createConferenceAndRegisterParticipants()
      await conference.finalize([1], {from:owner}).should.be.rejected;
      await conference.finalize([1, 1, 1], {from:owner}).should.be.rejected;
      await conference.finalize([], {from:owner}).should.be.rejected;
    })

    describe('success modes', () => {
      beforeEach(async () => {
        await createConferenceAndRegisterParticipants()
      })

      it('correctly updates attendee records - p1, p2, p256, p257, p298, p299', async function(){
        // none attended except p1, p2 and p256, p257, p298 and p299
        // 0 1 1 ... 1 1 ... 1 1
        // reverse order since we go from right to left in bit parsing:
        // [ 6 (110), ... ]

        const maps = [
          toBN(0).bincn(1).bincn(2),
          toBN(0).bincn(0).bincn(1).bincn(298 % 256).bincn(299 % 256),
        ]

        outputBNs(maps)
        await conference.finalize(maps, {from:owner});
        // thorough check to see who has been marked attended vs not attended
        const attended = [ 1, 2, 256, 257, 298, 299 ]
        for (let i = 0; i < numRegistered; ++i) {
          try {
            if (attended.includes(i)) {
              await conference.isAttended(accounts[10 + i]).should.eventually.eq(true)
            } else {
              await conference.isAttended(accounts[10 + i]).should.eventually.eq(false)
            }
          } catch (err) {
            console.error(`Failed for p${i} - ${accounts[10 + i]}`)
            throw err
          }
        }
        await conference.totalAttended().should.eventually.eq(6)
        const payout = await conference.payoutAmount()
        const expectedPayout = deposit.mul(toBN(numRegistered)).div(toBN(6))
        payout.should.eq(expectedPayout)
        await conference.payoutAmount().should.eventually.eq(payout)
      })

      it('correctly updates attendee records - p256', async function(){
        // only p256 attended
        const maps = [ toBN(0), toBN(0).bincn(0) ]

        outputBNs(maps)
        await conference.finalize(maps, {from:owner});
        // thorough check to see who has been marked attended vs not attended
        const attended = [ 256 ]
        for (let i = 0; i < numRegistered; ++i) {
          try {
            if (attended.includes(i)) {
              await conference.isAttended(accounts[10 + i]).should.eventually.eq(true)
            } else {
              await conference.isAttended(accounts[10 + i]).should.eventually.eq(false)
            }
          } catch (err) {
            console.error(`Failed for p${i} - ${accounts[10 + i]}`)
            throw err
          }
        }
        await conference.totalAttended().should.eventually.eq(1)
        const payout = await conference.payoutAmount()
        const expectedPayout = deposit.mul(toBN(numRegistered))
        payout.should.eq(expectedPayout)
        await conference.payoutAmount().should.eventually.eq(payout)
      })

      it('correctly updates attendee records - p255', async function(){
        // only p255 attended
        const maps = [ toBN(0).bincn(255), toBN(0) ]

        outputBNs(maps)

        await conference.finalize(maps, {from:owner});

        // thorough check to see who has been marked attended vs not attended
        const attended = [ 255 ]
        for (let i = 0; i < numRegistered; ++i) {
          try {
            if (attended.includes(i)) {
              await conference.isAttended(accounts[10 + i]).should.eventually.eq(true)
            } else {
              await conference.isAttended(accounts[10 + i]).should.eventually.eq(false)
            }
          } catch (err) {
            console.error(`Failed for p${i} - ${accounts[10 + i]}`)
            throw err
          }
        }

        await conference.totalAttended().should.eventually.eq(1)

        const payout = await conference.payoutAmount()
        const expectedPayout = deposit.mul(toBN(numRegistered))
        payout.should.eq(expectedPayout)
        await conference.payoutAmount().should.eventually.eq(payout)
      })

      it('correctly updates attendee records - p255, p257', async function(){
        // only p255, p257 attended
        const maps = [ toBN(0).bincn(255), toBN(0).bincn(1) ]

        outputBNs(maps)

        await conference.finalize(maps, {from:owner});

        // thorough check to see who has been marked attended vs not attended
        const attended = [ 255, 257 ]
        for (let i = 0; i < numRegistered; ++i) {
          try {
            if (attended.includes(i)) {
              await conference.isAttended(accounts[10 + i]).should.eventually.eq(true)
            } else {
              await conference.isAttended(accounts[10 + i]).should.eventually.eq(false)
            }
          } catch (err) {
            console.error(`Failed for p${i} - ${accounts[10 + i]}`)
            throw err
          }
        }

        await conference.totalAttended().should.eventually.eq(2)

        const payout = await conference.payoutAmount()
        const expectedPayout = deposit.mul(toBN(numRegistered)).div(toBN(2))
        payout.should.eq(expectedPayout)
        await conference.payoutAmount().should.eventually.eq(payout)
      })

      it('correctly updates attendee records - none attended', async function(){
        // none attended
        const maps = [ toBN(0), toBN(0) ]

        outputBNs(maps)

        await conference.finalize(maps, {from:owner});

        // thorough check to see who has been marked attended vs not attended
        for (let i = 0; i < numRegistered; ++i) {
          try {
            await conference.isAttended(accounts[10 + i]).should.eventually.eq(false)
          } catch (err) {
            console.error(`Failed for p${i} - ${accounts[10 + i]}`)
            throw err
          }
        }

        await conference.totalAttended().should.eventually.eq(0)

        const payout = await conference.payoutAmount()
        const expectedPayout = toBN(0)
        payout.should.eq(expectedPayout)
        await conference.payoutAmount().should.eventually.eq(payout)
      })

      it('correctly updates attendee records - all attended', async function(){
        let n1 = toBN(0)
        for (let i = 0; i < 256; i += 1) {
          n1 = n1.bincn(i)
        }

        let n2 = toBN(0)
        for (let i = 0; i < (300 - 256); i += 1) {
          n2 = n2.bincn(i)
        }

        const maps = [ n1.toString(10), n2.toString(10) ]

        await conference.finalize(maps, {from:owner});

        // thorough check to see who has been marked attended vs not attended
        for (let i = 0; i < numRegistered; ++i) {
          try {
            await conference.isAttended(accounts[10 + i]).should.eventually.eq(true)
          } catch (err) {
            console.error(`Failed for p${i} - ${accounts[10 + i]}`)
            throw err
          }
        }

        await conference.totalAttended().should.eventually.eq(numRegistered)

        const payout = await conference.payoutAmount()
        const expectedPayout = deposit
        payout.should.eq(expectedPayout)
        await conference.payoutAmount().should.eventually.eq(payout)
      })
    })
  })
}

module.exports = {
  shouldHandleLargeParty
};
