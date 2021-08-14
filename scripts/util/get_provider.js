const Web3 = require('web3')
const { networks } = require('../../truffle-config.js')

const getProvider = (network, maxAccountsNeeded) => {
  let provider = new Web3.providers.HttpProvider(
    `http://${networks.development.host}:${networks.development.port}`
  )

  switch (network) {
    case 'ropsten':
      provider = networks.ropsten.provider(maxAccountsNeeded)
      break;
    case 'rinkeby':
      provider = networks.rinkeby.provider(maxAccountsNeeded)
      break;
    case 'kovan':
      provider = networks.kovan.provider(maxAccountsNeeded)
      break;
    case 'polygon':
      provider = networks.polygon.provider(maxAccountsNeeded)
      break;
    case 'mumbai':
      provider = networks.mumbai.provider(maxAccountsNeeded)
      break;
    case 'mainnet':
      provider = networks.mainnet.provider(maxAccountsNeeded)
      break;
    default:
      break;
  }

  return provider
}

module.exports = {
  getProvider
}
