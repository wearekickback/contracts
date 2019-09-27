#!/usr/bin/env node

const { Deployer, Token } = require('../../')
const fs = require('fs')
const path = require('path')
const Web3 = require('web3')
const projectDir = path.join(__dirname, '..', '..')

async function init () {
  const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))

  const networkId = await web3.eth.net.getId()

  const { address, transactionHash } = Deployer.networks[networkId] || {}
  const { address:tokenAddress }  = Token.networks[networkId] || {}
  console.log(`Deployer: ${address}  (tx: ${transactionHash})`)
  console.log(`Dummy DAI token: ${tokenAddress}`)
  const serverDir = path.join(projectDir, '..', 'server')
  if (fs.existsSync(serverDir)) {
    console.log('Writing to server config ...')

    const serverEnvPath = path.join(serverDir, '.env')
    fs.appendFileSync(serverEnvPath, `\nDEPLOYER_CONTRACT_ADDRESS=${address}`)
    fs.appendFileSync(serverEnvPath, `\nDEPLOYER_TRANSACTION=${transactionHash}`)
  } else {
    console.warn('Server folder not found, skipping ...')
  }

  const appDir = path.join(projectDir, '..', 'app')
  if (fs.existsSync(appDir)) {
    console.log('Writing to app config ...')

    const appConfigPath = path.join(appDir, 'src', 'config', 'env.json')
    let appConfig = {}
    try {
      appConfig = require(appConfigPath)
    } catch (err) {
      /* do nothing */
    }
    appConfig.DEPLOYER_CONTRACT_ADDRESS = address
    appConfig.DAI_CONTRACT_ADDRESS = tokenAddress
    fs.writeFileSync(appConfigPath, JSON.stringify(appConfig, null, 2))
  } else {
    console.warn('App folder not found, skipping ...')
  }
}

init().catch(err => {
  console.error(err)
  process.exit(-1)
})
