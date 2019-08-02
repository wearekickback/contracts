const Deployer = artifacts.require("./Deployer.sol");
const EthDeployer = artifacts.require("./EthDeployer.sol");
const ERC20Deployer = artifacts.require("./ERC20Deployer.sol");
const Token = artifacts.require("MyToken.sol");

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
let tld = 'eth';
let limitOfParticipants = 0; // 0 falls back to the contract default
const emptyAddress = '0x0000000000000000000000000000000000000000';
// eg: truffle migrate --config '{"name":"CodeUp No..", "limitOfParticipants":15}'
if (yargs.argv.config) {
  config = JSON.parse(yargs.argv.config);
}

module.exports = function(deployer) {
  if (deployer.network == 'test' || deployer.network == 'coverage') return 'no need to deploy contract';
  if (config.name){
    name = config.name;
  }

  if (config.limitOfParticipants){
    limitOfParticipants = config.limitOfParticipants;
  }

  return deployer.then(async () => {
    console.log('deployer1')
    if (deployer.network == 'development'){
      await deployer.deploy(Token);
      token =  await Token.deployed();
    }
    console.log('deployer2')
    await deployer.deploy(EthDeployer);
    await deployer.deploy(ERC20Deployer);
    console.log('deployer3')
    const ethDeployer   = await EthDeployer.deployed();
    console.log('deployer4')
    const erc20Deployer = await ERC20Deployer.deployed();
    console.log('deployer5')
    await deployer.deploy(Deployer, ethDeployer.address, erc20Deployer.address);
    console.log('deployer6')
    const mainDeployer = await Deployer.deployed();
    console.log('deployer7')
    console.log([name, deposit,limitOfParticipants, coolingPeriod].join(','));
    console.log('deployer8')
    // return deployer.deploy(Conference, name, deposit,limitOfParticipants, coolingPeriod, emptyAddress);
  });
}
