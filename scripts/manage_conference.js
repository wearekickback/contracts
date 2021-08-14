#!/usr/bin/env node

/* This script manages the specified Conference contract */

const fs = require('fs')
const Web3 = require('web3')
const { toHex, toWei } = require('web3-utils')
const program = require('commander')

const { Conference } = require('..')
const { getProvider } = require('./util/get_provider')

const adminFile = './.admins.js'

// Example
// node ./scripts/manage_conference.js --address 0x5c113a29ac04311b3df0c7e4999b358689d58bd1 --network polygon
async function init() {
  program
    .usage('[options]')
    .option('-a, --address <address>', 'Address of Conference contract')
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

  const provider = getProvider(network, 2)
  const web3 = new Web3(provider)
  const networkId = await web3.eth.net.getId()
  console.log('networkId', networkId)

  const accounts = await web3.eth.getAccounts()
  const [account] = accounts
  console.log(`Owner: ${account}`)

  const conference = new web3.eth.Contract(Conference.abi, address)
  const isAdmin = await conference.methods.isAdmin(account).call()
  console.log('isAdmin', isAdmin)

  const name = await conference.methods.name().call()
  console.log('name', name)

  const limitOfParticipants = await conference.methods.limitOfParticipants().call()
  console.log('limitOfParticipants', limitOfParticipants)

  const isRegistered1 = await conference.methods.isRegistered(account).call()
  console.log('isRegistered', isRegistered1)

  if (!isRegistered1) {
    const registerResult = await conference.methods.register().send({ from: account, value: toWei('0.02').toString(16), gas: 200000 })
    console.log(registerResult)

    const isRegistered2 = await conference.methods.isRegistered(account).call()
    console.log('isRegistered', isRegistered2)
  }

  const participant = await conference.methods.participants(account).call()
  console.log('participant', participant)

  const tokenUri = await conference.methods.tokenURI(participant.index).call()
  console.log('tokenUri', tokenUri)
}

init()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error(err)
    process.exit(-1)
  })
