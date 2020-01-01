import { toHex, toWei } from 'web3-utils'

import { getEvents } from './utils'

const Deployer = artifacts.require("Deployer.sol")
const EthDeployer = artifacts.require("EthDeployer.sol")
const ERC20Deployer = artifacts.require("ERC20Deployer.sol")
const Conference = artifacts.require("AbstractConference.sol")
const Token = artifacts.require("MyToken.sol");

contract('Deployer', accounts => {
  let deployer, ethDeployer, erc20Deployer;
  let emptyAddress = '0x0000000000000000000000000000000000000000'
  let clearFee = 1
  beforeEach(async () => {
    ethDeployer = await EthDeployer.new();
    erc20Deployer = await ERC20Deployer.new();
    deployer = await Deployer.new(ethDeployer.address, erc20Deployer.address)
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

  it('can deploy a EthConference', async () => {
    const result = await deployer.deploy(
      'test',
      toHex(toWei('0.02')),
      toHex(2),
      toHex(60 * 60 * 24 * 7),
      emptyAddress,
      clearFee
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
      token.address,
      clearFee
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

  it('when it deploys a Conference the owner is the caller', async () => {
    const result = await deployer.deploy(
      'test',
      toHex(toWei('0.02')),
      toHex(2),
      toHex(60 * 60 * 24 * 7),
      emptyAddress,
      clearFee
    )

    const [ { args: { deployedAddress} } ] = (await getEvents(result, 'NewParty'))

    const conference = await Conference.at(deployedAddress)

    await conference.owner().should.eventually.eq(accounts[0])
  })
})
