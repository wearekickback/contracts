const Token = require('./build/contracts/MyToken.json')
const Deployer = require('./build/contracts/Deployer.json')
const EthConference = require('./build/contracts/EthConference.json')
const ERC20Conference = require('./build/contracts/ERC20Conference.json')
const AbstractConference = require('./build/contracts/AbstractConference.json')
const Conference = require('./build/contracts/Conference.json')
const EthDeployer = require('./build/contracts/EthDeployer.json')
const ERC20Deployer = require('./build/contracts/ERC20Deployer.json')

module.exports = {
  Token,
  Deployer,
  Conference,
  EthConference,
  ERC20Conference,
  AbstractConference,
  EthDeployer,
  ERC20Deployer,
  events: {
    /* when new party gets deployed */
    NewParty: Deployer.abi.find(({ type, name }) => type === 'event' && name === 'NewParty'),
    /* when someone registers for a party */
    Register: Conference.abi.find(({ type, name }) => type === 'event' && name === 'RegisterEvent'),
    /* when party attendance is finalized and payout is enabled */
    Finalize: Conference.abi.find(({ type, name }) => type === 'event' && name === 'FinalizeEvent'),
    /* when someone withdraws their payout */
    Withdraw: Conference.abi.find(({ type, name }) => type === 'event' && name === 'WithdrawEvent'),
    /* when someone sends and withdraws their payout */
    SendAndWithdraw: Conference.abi.find(({ type, name }) => type === 'event' && name === 'SendAndWithdraw'),
    /* when the party gets cancelled */
    CancelParty: Conference.abi.find(({ type, name }) => type === 'event' && name === 'CancelEvent'),
    /* when a new admin gets added */
    AddAdmin: Conference.abi.find(({ type, name }) => type === 'event' && name === 'AdminGranted'),
    /* when an admin gets removed */
    RemoveAdmin: Conference.abi.find(({ type, name }) => type === 'event' && name === 'AdminRevoked'),
    /* when ownership gets tranferred */
    ChangeOwner: Conference.abi.find(({ type, name }) => type === 'event' && name === 'OwnershipTransferred'),
    /* when participant limit changes */
    UpdateParticipantLimit: Conference.abi.find(({ type, name }) => type === 'event' && name === 'UpdateParticipantLimit'),    
  }
}
