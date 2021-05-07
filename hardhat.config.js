require("@nomiclabs/hardhat-truffle5");

module.exports = {
  networks: {
      hardhat: {
        gasPrice:1,
        accounts:{
          count: 500,
          accountsBalance: '2000000000000000000000000'
        }      
      }
  },
  mocha: {
  },
  solidity: {
    version: "0.5.11",
  },
};