const Deployer = artifacts.require("./Deployer.sol");
const EthDeployer = artifacts.require("./EthDeployer.sol");
const ERC20Deployer = artifacts.require("./ERC20Deployer.sol");
const Token = artifacts.require("MyToken.sol");
const path = require('path')

const coolingPeriod = 1 * 60 * 60 * 24 * 7;
// this is already required by truffle;
const yargs = require('yargs');
const crypto = require('crypto');
const fs = require('fs');
const { sha3 }  = require('web3-utils')

let config = {};
let token;
let name = ''; // empty name falls back to the contract default
let deposit = 0; // 0 falls back to the contract default
let limitOfParticipants = 0; // 0 falls back to the contract default
let clearFee = 50; // 5%
let admins
const emptyAddress = '0x0000000000000000000000000000000000000000';
// eg: truffle migrate --config '{"name":"CodeUp No..", "limitOfParticipants":15}'
if (yargs.argv.config) {
  config = JSON.parse(yargs.argv.config);
}
const adminFile = './.admins.js'

module.exports = function(deployer) {
  if (fs.existsSync(adminFile)) {
    admins = fs.readFileSync(adminFile, 'utf8').slice(0,-1).split('\n')
    console.log({admins})
  }else{
    console.log(`No admin addreses set on ${adminFile}`)
  }

  if (deployer.network == 'test' || deployer.network == 'coverage') return 'no need to deploy contract';
  if (config.name){
    name = config.name;
  }
  if (config.limitOfParticipants){
    limitOfParticipants = config.limitOfParticipants;
  }
  console.log(deployer.network)
  return deployer.then(async () => {
    if (deployer.network == 'development'){
      await deployer.deploy(Token);
      token =  await Token.deployed();
    }
    await deployer.deploy(EthDeployer);
    await deployer.deploy(ERC20Deployer);
    const ethDeployer   = await EthDeployer.deployed();
    const erc20Deployer = await ERC20Deployer.deployed();
    await deployer.deploy(Deployer, ethDeployer.address, erc20Deployer.address, clearFee);
    const mainDeployer = await Deployer.deployed();
    console.log([name, deposit,limitOfParticipants, coolingPeriod, clearFee].join(','));
    if(admins){
      await mainDeployer.grant(admins)
    }
    console.log('Admin granted to', admins)
    if(deployer.network == 'docker' || deployer.network == 'development'){
      console.log('deploying a party', {name, deposit,limitOfParticipants, coolingPeriod, emptyAddress})
      await mainDeployer.deploy(name, deposit,limitOfParticipants, coolingPeriod, emptyAddress);
    }
  });
}
