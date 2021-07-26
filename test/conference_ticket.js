const { toWei } = require('web3-utils')
const Conference = artifacts.require("./EthConference.sol");
const ConferenceTicket = artifacts.require("./ConferenceTicket.sol");

require('./utils')

contract('Conference Ticket', function(accounts) {
  let ct;
  let emptyAddress = '0x0000000000000000000000000000000000000000';
  let newConferenceAddress = '0x0000000000000000000000000000000000000001';
  let newBaseTokenURI = 'https://kickback.events/test/'
  beforeEach(async function(){
    ct = await ConferenceTicket.new('')
    this.accounts = accounts
    this.createConference = async ({
      name = '',
      deposit = toWei('0.02', "ether"),
      limitOfParticipants = 20,
      coolingPeriod = 0,
      ownerAddress = accounts[0],
      clearFee = 10,
      ticketAddress = ct.address,
      gasPrice = toWei('1', 'gwei')
    }) => {
      let conference = await Conference.new(
        name,
        deposit,
        limitOfParticipants,
        coolingPeriod,
        ownerAddress,
        clearFee,
        ticketAddress
        , {gasPrice:gasPrice}
      );
      await ct.setConferenceAddress(conference.address);
      return conference;
    }
  })

  describe('on new', function(){
    it('metadata uri is empty', async function(){
      await ct.baseTokenURI().should.eventually.eq('')
    })
    it('conference address is empty', async function(){
      await ct.conferenceAddress().should.eventually.eq(emptyAddress)
    })
  })

  describe('can set baseTokenURI', function(){
    it('success if admin', async function(){
      await ct.baseTokenURI().should.eventually.eq('')
      await ct.setBaseTokenURI(newBaseTokenURI, { from: accounts[0]})
      await ct.baseTokenURI().should.eventually.eq(newBaseTokenURI)
    })

    it('fail if not admin', async function(){
      await ct.baseTokenURI().should.eventually.eq('')
      await ct.setBaseTokenURI(newConferenceAddress, { from: accounts[1]}).should.be.rejected
      await ct.baseTokenURI().should.eventually.eq('')
    })
  })

  describe('can set conferenceAddress', function(){
    it('success if admin', async function(){
      await ct.conferenceAddress().should.eventually.eq(emptyAddress)
      await ct.setConferenceAddress(newConferenceAddress, { from: accounts[0]})
      await ct.conferenceAddress().should.eventually.eq(newConferenceAddress)
    })

    it('fail if not admin', async function(){
      await ct.conferenceAddress().should.eventually.eq(emptyAddress)
      await ct.setConferenceAddress(newConferenceAddress, { from: accounts[1]}).should.be.rejected
      await ct.conferenceAddress().should.eventually.eq(emptyAddress)
    })
  })

  it('can set admins', async() => {
    await ct.setConferenceAddress(newConferenceAddress, { from: accounts[1]}).should.be.rejected
    await ct.conferenceAddress().should.eventually.eq(emptyAddress)
    await ct.grant([accounts[1]], { from: accounts[0]})
    await ct.setConferenceAddress(newConferenceAddress, { from: accounts[1]}).should.be.fulfilled
    await ct.conferenceAddress().should.eventually.eq(newConferenceAddress)
  })

  describe('on mint', function(){
    it('success if admin', async function(){
      let tokenId = 123
      await ct.tokenURI(tokenId).should.be.rejected
      await ct.mint(accounts[1], tokenId).should.be.fulfilled
      await ct.tokenURI(tokenId).should.eventually.eq(tokenId.toString())
    })

    it('fail if not admin', async function(){
      let tokenId = 123
      await ct.tokenURI(tokenId).should.be.rejected
      await ct.mint(accounts[1], tokenId, { from: accounts[1]}).should.be.rejected
      await ct.tokenURI(tokenId).should.be.rejected
    })

    it('tokenURI is set', async function(){
      let tokenId = 123
      await ct.setBaseTokenURI('https://kickback.events/test/')
      await ct.mint(accounts[1], tokenId).should.be.fulfilled
      await ct.tokenURI(tokenId).should.eventually.eq('https://kickback.events/test/123')
    })
  })

  describe('on safe transfer', function(){
    let tokenId = 321
    let conference
    beforeEach(async function(){
      await ct.mint(accounts[1], tokenId).should.be.fulfilled
      await ct.ownerOf(tokenId).should.eventually.eq(accounts[1])
      conference = await this.createConference({})
    })

    it('success if owner', async function(){
      let from = accounts[1]
      let to = accounts[2]
      await ct.safeTransferFrom(from, to, tokenId, { from: accounts[1]}).should.be.fulfilled
      await ct.ownerOf(tokenId).should.eventually.eq(to)
    })

    it('success if approved', async function(){
      let from = accounts[1]
      let to = accounts[2]
      await ct.approve(to, tokenId, { from: accounts[1]}).should.be.fulfilled
      await ct.safeTransferFrom(from, to, tokenId, { from: accounts[2]}).should.be.fulfilled
      await ct.ownerOf(tokenId).should.eventually.eq(to)
    })

    it('fail if not owner', async function(){
      let from = accounts[1]
      let to = accounts[2]
      await ct.safeTransferFrom(from, to, tokenId).should.be.rejected
      await ct.ownerOf(tokenId).should.eventually.eq(from)
    })
  })
})
