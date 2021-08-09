#!/usr/bin/env node

/* This script sets new admins for the Deployer contract */

const fs = require('fs')
const Web3 = require('web3')
const program = require('commander')

const { Deployer } = require('..')
const { getProvider } = require('./util/get_provider')

const adminFile = './.admins.js'

// Example
// node ./scripts/add_admin.js --address 0xBC1F39298FE76Ad9B3bF3cFe8C26e62491e032c1 --network polygon
async function init() {
  program
    .usage('[options]')
    .option('-a, --address <address>', 'Address of Deployer contract')
    .option('-n, --network <network>', 'Name of the network (e.g. ropsten, mainnet, etc.)')
    .parse(process.argv)

  const options = program.opts()
  const address = options.address
  const network = options.network
  let admins = []

  if (!address) {
    throw new Error('Address not given')
  } else {
    console.log('address', address)
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

  const baseTokenUri = await deployer.methods.baseTokenUri().call();
  console.log('baseTokenUri', baseTokenUri)

  const existingAdmins = await deployer.methods.getAdmins().call();
  console.log('existingAdmins', existingAdmins)

  if (Array.isArray(existingAdmins)) {
    const newAdmins = []
    for (let index = 0; index < admins.length; index++) {
      const admin = admins[index]
      if (existingAdmins.findIndex(item => item.toLowerCase() === admin.toLowerCase()) < 0) {
        console.log(`Granting '${admin}' admin right`)
        newAdmins.push(admin)
      }
    }
    if (newAdmins.length > 0) {
      console.log(newAdmins)
      await deployer.methods.grant(newAdmins).send({ from: account, gas: 200000 })
    }
  }
}

init()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error(err)
    process.exit(-1)
  })
