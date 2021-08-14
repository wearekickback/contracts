#!/usr/bin/env node

/* This script deploys a new Conference with the Deployer contract */

const fs = require('fs')
const Web3 = require('web3')
const { toHex, toWei } = require('web3-utils')
const program = require('commander')

const { Deployer } = require('..')
const { getProvider } = require('./util/get_provider')

const adminFile = './.admins.js'
const emptyAddress = '0x0000000000000000000000000000000000000000'

// Example
// node ./scripts/deploy_conference.js --address 0xBC1F39298FE76Ad9B3bF3cFe8C26e62491e032c1 --network polygon --name 'Test conference'
async function init() {
  program
    .usage('[options]')
    .option('-a, --address <address>', 'Address of Deployer contract')
    .option('-n, --network <network>', 'Name of the network (e.g. ropsten, mainnet, etc.)')
    .option('--name <name>', 'Name of conference')
    .parse(process.argv)

  const options = program.opts()
  const address = options.address
  const network = options.network
  const name = options.name
  let admins = []

  if (!address) {
    throw new Error('Address not given')
  } else {
    console.log('address', address)
  }

  if (!name) {
    throw new Error('Name not given')
  } else {
    console.log('name', name)
  }

  if (fs.existsSync(adminFile)) {
    admins = fs.readFileSync(adminFile, 'utf8').split('\n')
    console.log('admins', admins)
  } else {
    console.log(`No admin addreses set on ${adminFile}`)
  }

  const provider = getProvider(network, 1)
  const web3 = new Web3(provider)
  const networkId = await web3.eth.net.getId()
  console.log('networkId', networkId)

  const accounts = await web3.eth.getAccounts()
  const [account] = accounts
  console.log(`Owner: ${account}`)

  const deployer = new web3.eth.Contract(Deployer.abi, address)
  const isAdmin = await deployer.methods.isAdmin(account).call();
  console.log('isAdmin', isAdmin)

  const deposit = toHex(toWei('0.02'))
  const limitOfParticipants = toHex(2)
  const coolingPeriod = toHex(60 * 60 * 24 * 7)
  const conference = await deployer.methods.deploy(name, deposit, limitOfParticipants, coolingPeriod, emptyAddress).send({ from: account, gas: 6721975 })
  console.log(conference)
}

init()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error(err)
    process.exit(-1)
  })
