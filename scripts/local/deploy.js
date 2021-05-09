require("@nomiclabs/hardhat-ethers");
const { ethers } = require("hardhat");
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

let config = {};
let token;
let name = ''; // empty name falls back to the contract default
let deposit = 0; // 0 falls back to the contract default
let limitOfParticipants = 0; // 0 falls back to the contract default
let clearFee = 10; // 1%
let admins
const emptyAddress = '0x0000000000000000000000000000000000000000';
// eg: truffle migrate --config '{"name":"CodeUp No..", "limitOfParticipants":15}'
if (yargs.argv.config) {
  config = JSON.parse(yargs.argv.config);
}
const adminFile = './.admins.js'

async function main({HARDHAT_NETWORK}) {  
    console.log({HARDHAT_NETWORK})
    const Deployer = await ethers.getContractFactory("Deployer");
    const EthDeployer = await ethers.getContractFactory("EthDeployer");
    const ERC20Deployer = await ethers.getContractFactory("ERC20Deployer");
    const Token = await ethers.getContractFactory("MyToken");
    console.log({Deployer})    
    if (fs.existsSync(adminFile)) {
        admins = fs.readFileSync(adminFile, 'utf8').slice(0,-1).split('\n')
        console.log({admins})
      }else{
        console.log(`No admin addreses set on ${adminFile}`)
      }
    
      if (HARDHAT_NETWORK == 'test' || HARDHAT_NETWORK == 'coverage') return 'no need to deploy contract';
      if (config.name){
        name = config.name;
      }
      if (config.limitOfParticipants){
        limitOfParticipants = config.limitOfParticipants;
      }
    if (HARDHAT_NETWORK == 'development'){
        token =  await Token.deploy(Token);
    }
    const ethDeployer   = await EthDeployer.deploy();
    const erc20Deployer = await ERC20Deployer.deploy();        
    const mainDeployer = await Deployer.deploy(ethDeployer.address, erc20Deployer.address, clearFee);
    console.log([name, deposit,limitOfParticipants, coolingPeriod, clearFee].join(','));
    if(admins){
        await mainDeployer.grant(admins)
    }
    console.log('Admin granted to', admins)
    if(HARDHAT_NETWORK == 'docker' || HARDHAT_NETWORK == 'localhost'){
        console.log('deploying a party', {name, deposit,limitOfParticipants, coolingPeriod, emptyAddress})
        await mainDeployer.deploy(name, deposit,limitOfParticipants, coolingPeriod, emptyAddress);
    }
    console.log(`Deployed at ${mainDeployer.address}`)
  }
  
  main(process.env)
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });