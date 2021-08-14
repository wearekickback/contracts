require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-ethers");
require("solidity-coverage")

module.exports = {
  networks: {
      hardhat: {
        gasPrice:1,
        accounts:{
          count: 500,
          accountsBalance: '2000000000000000000000000'
        },
        allowUnlimitedContractSize: true
      },
      localhost: {
        url: "http://127.0.0.1:8545"
      }
  },
  mocha: {
  },
  solidity: {
    version: "0.5.11",
  },
};