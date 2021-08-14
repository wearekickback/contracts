#!/usr/bin/env node

/* This script deploys a new party using the Deployer */

const fs = require('fs')
const path = require('path')
const Web3 = require('web3')
const EthVal = require('ethval')
const program = require('commander')
const { toBN, fromWei, toHex, toWei } = require('web3-utils')
const faker = require('faker')

const { Deployer, Conference } = require('../../')
const deployedAddresses = require('../../deployedAddresses.json')
const { networks } = require('../../truffle-config.js')

async function waitTx (promise) {
  const txReceipt = await promise
  if (txReceipt.status !== '0x1') {
    console.error(JSON.stringify(txReceipt, null, 2))
    throw new Error('transaction failed')
  }
  return txReceipt
}

// Example
// yarn seed:party -p 299 -r 280 -d 0.02 -a $ADDRESS
async function init() {
  program
    .usage('[options]')
    .option('-a, --address <address>', 'Address of party (obtain from UI /create page)')
    .option('-n, --network <network>', 'Name of the network (e.g. ropsten, mainnet, etc.)')
    .option(
      '--admins <n>',
      'Number of additional party admins to have',
      parseInt
    )
    .option('-c, --cancelled', 'Whether to mark the party as cancelled')
    .option('-t, --coolingPeriod [n]', 'How long the cooling period is in seconds', 60 * 60 * 24 * 7)
    .option('-d, --deposit [n]', 'Amount of ETH attendees must deposit', 0.02)
    .option('-f, --finalize <n>', 'Finalize the party with the given no. of attendees', parseInt)
    .option(
      '-p, --participants <n>',
      'Maximum number of participants',
      parseInt
    )
    .option(
      '-r, --register <n>',
      'Number of participants to register',
      parseInt
    )
    .option(
      '-w, --withdraw <n>',
      'Number of attendees to withdraw payouts for',
      parseInt
    )
    .parse(process.argv)

  const address = program.address

  if (!address) {
    throw new Error('Address not given')
  }

  const network = program.network
  const cancelled = !!program.cancelled
  const numAdmins = program.admins || 0
  const maxParticipants = program.participants || 2
  const numRegistrations = program.register || 0
  const numFinalized = program.finalize || 0
  const numWithdrawals = program.withdraw || 0
  const deposit = new EthVal(program.deposit, 'eth')
  const coolingPeriod = program.coolingPeriod
  console.log(
    `
Config
------
Network:                ${network}
Party address:          ${address}
Deposit level:          ${deposit.toFixed(3)} ETH
Cooling Period:         ${coolingPeriod} seconds
Extra admins:           ${numAdmins}
Max. participants:      ${maxParticipants}
Num to register:        ${numRegistrations}
Party finalized:        ${numFinalized ? `yes - ${numFinalized} attendees` : 'no'}
Party cancelled:        ${cancelled ? 'yes' : 'no'}
Payout withdrawals:     ${numWithdrawals}
`
  )

  const maxAccountsNeeded = parseInt(Math.max(numRegistrations || numFinalized || numWithdrawals , numAdmins + 1), 10)

  const provider = getProvider(network, maxAccountsNeeded)
  const web3 = new Web3(provider)
  const networkId = await web3.eth.net.getId()
  console.log('networkId', networkId)

  const accounts = await web3.eth.getAccounts()

  const [account] = accounts
  console.log(`Owner: ${account}`)

  const party = new web3.eth.Contract(Conference.abi, address)
  if(numRegistrations){
    console.log(`

    Ensuring accounts have enough ETH in them
    ------------------------------------------`
    )
      const minEthNeededPerAccount = deposit.toWei().add(new EthVal(0.03, 'eth') /* assume 0.1 ETH for total gas cost */)
      // check main account
      const ownerBalance = new EthVal(await web3.eth.getBalance(accounts[0]))
      if (ownerBalance.lt(minEthNeededPerAccount)) {
        throw new Error(`Main account ${owner} only has ${ownerBalance.toEth().toFixed(4)} ETH but ${minEthNeededPerAccount.toFixed(4)} is needed.` )
      }
      for (let i = 1; maxAccountsNeeded > i; ++i) {
        console.log(i, accounts[i])
        const balance = new EthVal(await web3.eth.getBalance(accounts[i]))
    
        if (balance.lt(minEthNeededPerAccount)) {
          const rem = minEthNeededPerAccount.sub(balance)
          if (ownerBalance.sub(rem).lt(minEthNeededPerAccount)) {
            throw new Error(`Main account ${owner} does not enough ETH to share with ${accounts[i]}.` )
          }
    
          console.log(`${accounts[0]} -> ${accounts[i]} (${i}): ${rem.toEth().toFixed(4)} ETH`)
    
          await waitTx(web3.eth.sendTransaction({
            from: accounts[0],
            to: accounts[i],
            value: rem.toWei().toString(16)
          }))
        }
      }
      console.log('Done.')
  }

  if (numAdmins) {
    console.log(
      `

Register extra admins
---------------------`
    )

    const promises = []
    for (
      let i = 1 /* start at 1 since account 0 is already owner */;
      numAdmins >= i;
      i += 1
    ) {
      console.log(`${accounts[i]} (${i})`)

      promises.push(
        waitTx(party.methods
          .grant([accounts[i]])
          .send({ from: accounts[0], gas: 200000 }))
      )
    }

    await Promise.all(promises)
    console.log('Done.')
  }

  if (numRegistrations) {
    console.log(
      `

Register participants
-----------------------`
    )

    for (let i = 0; numRegistrations > i; i += 1) {
      console.log(`${accounts[i]} (${i})`)
      try{
        let tx = await party.methods.register().send({
          value: deposit.toWei().toString(16),
          from: accounts[i],
          gas: 200000
        })
        console.log(`SUCCESS ${accounts[i]} (${i}), ${tx.blockNumber}, ${tx.status}, ${tx.blockHash}`)
      }catch(e){
        console.log(`FAIL ${accounts[i]} (${i})`, e)
      }
    }
    console.log('Done.')
  }

  if (numFinalized) {
    console.log(
      `

Mark as finalized (${numFinalized} attendees)
------------------------------`
    )

    const maps = []
    let currentMap = toBN(0)
    for (let i = 0; numFinalized > i; i += 1) {
      console.log(`${accounts[i]} (${i})`)

      if (i % 256 === 0) {
        maps.push(toBN(0))
      }

      maps[maps.length - 1] = maps[maps.length - 1].bincn(i)
    }

    let finalizeTx = await waitTx(party.methods.finalize(maps).send({ from: accounts[0], gas: 200000 }))
    console.log(`SUCCESS ${finalizeTx.blockNumber}, ${finalizeTx.status}, ${finalizeTx.blockHash}`)
    console.log('Done.')
  }

  if (cancelled) {
    console.log(
      `

Mark party as cancelled
------------------------------`
    )

    await waitTx(party.methods.cancel().send({ from: accounts[0], gas: 200000 }))
    console.log('Done.')
}

  if (numWithdrawals) {
    const payout = new EthVal(await party.methods.payoutAmount().call())

    console.log(
      `

Withdraw payout - ${payout.toEth().toFixed(4)} ETH
-----------------------------`
    )

    for (let i = 0; numWithdrawals > i; i += 1) {      
      try{
        let tx = await party.methods.withdraw().send({ from: accounts[i], gas: 200000 })
        console.log(`SUCCESS ${accounts[i]} (${i}), ${tx.blockNumber}, ${tx.status}, ${tx.blockHash}`)
      }catch(e){
        console.log(`FAIL ${accounts[i]} (${i})`, e)
      }
    }
    console.log('Done.')
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
