#!/usr/bin/env node

/* This script deploys a new party using the Deployer */

const fs = require('fs')
const path = require('path')
const Web3 = require('web3')
const EthVal = require('ethval')
const program = require('commander')
const { toBN, fromWei, toHex, toWei } = require('web3-utils')
const faker = require('faker')
const { getProvider } = require('../util/get_provider')
const { Conference } = require('../../')
const { networks } = require('../../truffle-config.js')

// Example
// yarn tokenuri -e 0x123 -i 1
async function init() {
  program
    .usage('[options]')
    .option('-n, --network <network>', 'Name of the network (e.g. ropsten, mainnet, etc.)')
    .option('-e, --eventid <eventid>', 'Address of party contract address')
    .option('-i, --tokenid <tokenid>', 'Token id (the order of the participants)')
    .parse(process.argv)

  console.log({program: program._optionValues})
  const eventid = program._optionValues.eventid
  const tokenid = program._optionValues.tokenid
  console.log({eventid, tokenid })
  if (!(eventid && tokenid) ) {
    throw new Error('event or tokenid missing')
  }

  const network = program.network
  console.log(
    `
Config
------
Network:                ${network}
Party address:          ${eventid}
Token address:          ${tokenid}
`
  )

  const provider = getProvider(network)
  const web3 = new Web3(provider)
  const networkId = await web3.eth.net.getId()
  console.log('networkId', networkId)

  const accounts = await web3.eth.getAccounts()

  const [account] = accounts
  console.log(`Owner: ${account}`)

  const conference = new web3.eth.Contract(Conference.abi, eventid)

  try{
    tokenUri = await conference.methods.tokenURI(tokenid).call()
    console.log(`SUCCESS ${tokenUri}`)
  }catch(e){
    console.log(`FAIL`, e)
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
