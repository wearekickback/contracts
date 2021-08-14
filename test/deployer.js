const toHex = require('web3-utils').toHex
const toWei = require('web3-utils').toWei
const getEvents = require('./utils').getEvents

const Deployer = artifacts.require("Deployer.sol")
const EthDeployer = artifacts.require("EthDeployer.sol")
const ERC20Deployer = artifacts.require("ERC20Deployer.sol")
const Conference = artifacts.require("AbstractConference.sol")
const Token = artifacts.require("MyToken.sol");

contract('Deployer', accounts => {
  let deployer, ethDeployer, erc20Deployer;
  let baseTokenUri = 'https://kickback.events/test/'
  let newBaseTokenUri = 'http://localhost'
  let emptyAddress = '0x0000000000000000000000000000000000000000'
  let clearFee = 10
  let newFee = 100
  beforeEach(async () => {
    ethDeployer = await EthDeployer.new();
    erc20Deployer = await ERC20Deployer.new();
    deployer = await Deployer.new(
      ethDeployer.address,
      erc20Deployer.address,
      clearFee,
      baseTokenUri
    )
  })

  it('does not accept ETH', async () => {
    await deployer.send(1, { from: accounts[0] }).should.be.rejected
  })

  it('has an owner', async () => {
    await deployer.owner().should.eventually.eq(accounts[0])
  })

  it('is destructible', async () => {
    const { address } = deployer

    await deployer.destroy().should.be.fulfilled

    await Deployer.at(address).should.be.rejected
  })

  it('can set clearFee', async() => {
    await deployer.clearFee().should.eventually.eq(clearFee)
    await deployer.changeClearFee(newFee, { from: accounts[0]})
    await deployer.clearFee().should.eventually.eq(newFee)
  })

  it('can set baseTokenUri', async() => {
    await deployer.baseTokenUri().should.eventually.eq(baseTokenUri)
    await deployer.changeBaseTokenUri(newBaseTokenUri, { from: accounts[0]})
    await deployer.baseTokenUri().should.eventually.eq(newBaseTokenUri)
  })

  it('can set isPausable', async() => {
    await deployer.isPausable().should.eventually.eq(true)
    await deployer.changeIsPausable(false, { from: accounts[0]})
    await deployer.isPausable().should.eventually.eq(false)
  })

  it('can set admins', async() => {
    await deployer.changeClearFee(newFee, { from: accounts[1]}).should.be.rejected
    await deployer.clearFee().should.eventually.eq(clearFee)
    await deployer.changeBaseTokenUri(newBaseTokenUri, { from: accounts[1]}).should.be.rejected
    await deployer.baseTokenUri().should.eventually.eq(baseTokenUri)
    await deployer.grant([accounts[1]], { from: accounts[0]})
    await deployer.changeClearFee(newFee, { from: accounts[1]}).should.be.fulfilled
    await deployer.clearFee().should.eventually.eq(newFee)
    await deployer.changeBaseTokenUri(newBaseTokenUri, { from: accounts[1]}).should.be.fulfilled
    await deployer.baseTokenUri().should.eventually.eq(newBaseTokenUri)
  })

  it('can deploy a EthConference', async () => {
    const result = await deployer.deploy(
      'test',
      toHex(toWei('0.02')),
      toHex(2),
      toHex(60 * 60 * 24 * 7),
      emptyAddress
    )

    const events = await getEvents(result, 'NewParty')

    assert.deepEqual(events.length, 1)

    const [ event ] = events

    assert.nestedInclude(event.args, {
      deployer: accounts[0]
    })

    const { deployedAddress } = event.args
    const conference = await Conference.at(deployedAddress)
    await conference.limitOfParticipants().should.eventually.eq(2)
  })

  it('can deploy a ERC20Conference', async () => {
    const token = await Token.new();
    const result = await deployer.deploy(
      'test',
      toHex(10),
      toHex(2),
      toHex(60 * 60 * 24 * 7),
      token.address
    )

    const events = await getEvents(result, 'NewParty')

    assert.deepEqual(events.length, 1)

    const [ event ] = events

    assert.nestedInclude(event.args, {
      deployer: accounts[0]
    })

    const { deployedAddress } = event.args

    const conference = await Conference.at(deployedAddress)
    await conference.limitOfParticipants().should.eventually.eq(2)
    await conference.tokenAddress().should.eventually.eq(token.address)
  })

  describe('on Conference deployment', function() {
    let caller, conference, deposit;

    beforeEach(async function(){
      caller = accounts[0];
      const result = await deployer.deploy(
        'test',
        toHex(toWei('0.02')),
        toHex(2),
        toHex(60 * 60 * 24 * 7),
        emptyAddress
      )
  
      const [ { args: { deployedAddress} } ] = (await getEvents(result, 'NewParty'))
  
      conference = await Conference.at(deployedAddress)
      deposit = await conference.deposit()

      this.register = async function({conference, deposit, user, gasPrice = toWei('1', 'gwei')}){
        return await conference.register({value:deposit, from: user, gasPrice});
      }
    })


    it('the owner is the caller', async () => {
      await conference.owner().should.eventually.eq(caller)
    })

    it('tokenURI fails for nonexistent token', async function(){
      await conference.tokenURI(0).should.be.rejected
    })

    it('tokenURI is set without baseTokenURI', async function(){
      await this.register({conference, deposit, user:caller})
      let registered = await conference.registered()
      await deployer.changeBaseTokenUri('', { from: accounts[0]})
      await conference.tokenURI(registered).should.eventually.equalIgnoreCase(conference.address + '/' + registered)
    })

    it('tokenURI is set with baseTokenURI', async function(){
      await this.register({conference, deposit, user:caller})
      let registered = await conference.registered()
      await conference.tokenURI(registered).should.eventually.equalIgnoreCase(baseTokenUri + conference.address + '/' + registered)
    })
  })
})
