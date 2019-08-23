# Contracts

[![Build Status](https://api.travis-ci.org/wearekickback/contracts.svg?branch=master)](https://travis-ci.org/wearekickback/contracts)
[![Coverage Status](https://coveralls.io/repos/github/wearekickback/contracts/badge.svg?branch=master)](https://coveralls.io/github/wearekickback/contracts?branch=master)

This repo contains all the Kickback contracts. The `master` branch is the
main branch, and contains the productions versions of the contracts.

# Using the contracts

To use these contracts in a Dapp first install our NPM org:

```
npm i @wearekickback/contracts
```

Then, using [truffle-contract](https://github.com/trufflesuite/truffle/tree/develop/packages/truffle-contract) you can import and use the
`Deployer` contract definition and use it as such:

```js
const promisify = require('es6-promisify')
const TruffleContract = require('truffle-contract')
const Web3 = require('web3')
const { Deployer } = require('@wearekickback/contracts')

async init = () => {
  const web3 = new Web3(/* Ropsten or Mainnet HTTP RPC endpoint */)

  const contract = TruffleContract(Deployer)
  contract.setProvider(web3.currentProvider)

  const deployer = await contract.deployed()

  // deploy a new party (see Deployer.sol for parameter documentation)
  await deployer.deploy('My event', 0, 0, 0)

  const events = await promisify(deployer.contract.getPastEvents, deployer.contract)('NewParty')

  const { returnValues: { deployedAddress } } = events.pop()

  console.log(`New party contract deployed at: ${deployedAddress}`)
}
```

## Dev guide

Pre-requisites:

- [Node 8.12+](https://nodejs.org/)
- [Yarn](https://yarnpkg.com)

**Setup Truffle config**

Copy `.deployment-sample.js` to `.deployment.js` and edit the values
accordingly.

**Install dependencies and do basic setup**

```
yarn
yarn setup
```

Setup parameters for Truffle config:

```
cp .deployment-sample.js .deployment.js
```

**Run local chain**

```
npx ganache-cli --accounts 500
```

**Run tests**

```
yarn test
```

**Deploy contracts to local network**

Run:

```
yarn deploy:local
```

This will also call a script to update the `app` and `server` repo clones if
you've checked them out as sibling folders.


## Simulation

To deploy a new party onto the local test network:

```shell
yarn seed:party -i test
```

This command has a number of options which allow you additionally simulate the
full lifecycle of a party:

```shell
$ yarn seed:party --help

Usage: deployNewParty [options]

Options:

  -i, --id <id>            Id of party (obtain from UI /create page)
  --ropsten                Use Ropsten instead of local development network
  --rinkeby                Use Rinkeby instead of local development network
  --kovan                  Use Rinkeby instead of local development network
  --mainnet                Use Mainnet instead of local development network
  --admins <n>             Number of additional party admins to have
  -c, --cancelled          Whether to mark the party as cancelled
  -t, --coolingPeriod [n]  How long the cooling period is in seconds (default: 604800)
  -d, --deposit [n]        Amount of ETH attendees must deposit (default: 0.02)
  -f, --finalize <n>       Finalize the party with the given no. of attendees
  -p, --participants <n>   Maximum number of participants
  -r, --register <n>       Number of participants to register
  -w, --withdraw <n>       Number of attendees to withdraw payouts for
  -h, --help               output usage information
```

So, for example, to create party with max. 100 participants, upto 50 actually
registered, with 25 having actually attended, and 12 having withdrawn their
payouts after the party has ended. With an added cooling period of 1 millisecond to allow your to test the clear functionality immediately.

```shell
yarn seed:party -i test -p 100  -r 50 -a 25 -w 12 -e -t 1
```

The script actually uses `truffle-config.js` to work out how to connect to the
development network. If you want to seed a party on e.g. Ropsten then you can do by
supplying the `--ropsten` flag:

```shell
yarn seed:party --ropsten -i test -p 100  -r 50 -a 25 -w 12 -e -t 1
```

_Note: For public network seeding to work you will need to have
configured valid values in `.deployment.js` (see "Deployment to public networks" below)._

## Tests

```
yarn coverage
```

## Deployment to public networks

Edit `.deployment.js` and fill in the company mnemonic and Infura key (obtain from 1Password).

Releases are done automatically via CI. Prior to doing a release, ensure the
latest compiled contracts have been deployed to both test nets and the `mainnet`:

```
$ yarn deploy:ropsten
$ yarn deploy:rinkeby
$ yarn deploy:mainnet
```

_Note: ensure `.deployment.js` is accurately setup for the above to work_.

Then create a new release:

1. Increment the `version` in `package.json` as required, as part of a new or existing Pull Request.
2. Once the approved PR has been merged, run `git tag <version>` (where `<version>` is same as in `package.json`) on the merge commit.
3. Run `git push --tags`
4. The CI server will now do a build and deploy to NPM.
5. Once the NPM package has been published you will need to update the dependency to
it in both the `server` and `app` repositories so that they both refer to the
latest contract ABI when talking to the blockchain.

## Business logic and smart contract structure

### Actors

- Event organser = the creator of the event contract. There is only one per event.
- Event admins = the people who can help the event organiser. Can do everything the organiser can do apart from transfering the contract ownership and destroying the event contract deployer contract.
- Participants = People who did RSVP the event
- Attendees = People who were marked as attended

### Event flow

- When the event organiser creates an event, the organiser can specify the unit of currency (ETH or ERC20), name of the event(`name`), amount of commitment (`deposit`), event capaicty (`limitOfParticipants`), and cooling period (`cooling period`).
- The event organiser adds admins
- Until the first participant RSVP, the event admins can change the name and `deposit` amount
- The vent admins can change limitOfParticipants to increase the capacity of the event.
- When participants RSVP, they can RSVP if they call `register` function with `deposit`.
- For events participants commit ERC20 tokens, the user has to call `token.approve(deposit)` prior to RSVP.
- When user arrives to the venue, admins can check in users. This will be done off chain.
- If the event is canceled, each participant can withdraw the deposit amount (minus gas fee)
- Once the event is over, one of the admins call `finalize` sending the array of participants information in the bitmap format (to save gas).
- Once the event is finalised, the attendees can withdraw the proportion of the sum of the deposit on the contract. For example, if the `deposit` is 0.1 ETH , 10 people RSVP, and 5 people turned up, then each attendee can withdraw 1/5 = 0.2 ETH.
- If the attendees do not withdraw within cooling period, one of the admins can `clear` so that the remaining `deposit` will be send to the event organiser.

### Contract files

```
~/.../kickback/contracts (spike-dai)$tree contracts/
contracts/
├── AbstractConference.sol
├── Conference.sol
├── Deployer.sol
├── DeployerInterface.sol
├── ERC20Conference.sol
├── ERC20Deployer.sol
├── EthConference.sol
├── EthDeployer.sol
├── GroupAdmin.sol
├── Migrations.sol
├── MyToken.sol
└── zeppelin
    ├── lifecycle
    │   └── Destructible.sol
    └── ownership
        └── Ownable.sol

```


- Each even has its own contract. `AbstractConference.sol` is the superclass which contains all the functions. 
- The `AbstractConference.sol` inherits from Distructible, Ownnable and GroupAdmin.
- `ERC20Conference.sol` and `EthConference.sol` inherits `AbstractConference.sol` and override logic to RSVP and withdraw.
- `Deployer.sol` is a factory contract to deploy smart contract for each event.
- Due to the gas size exceeding block size, the actual binaries of the contracts are deployed via `ERC20Deployer.sol` and `EthDeployer.sol` and their deployed contract addresses are passed into the constructor of `Deployer.sol`. The `Deployer.sol` determins whether it should deploy ERC20 version if contract address is passed. Otherwise it will deploy the Eth version.
- For ERC20 token contracts, we import openzeppelin library.

```
$grep openzeppelin contracts/*sol
contracts/ERC20Conference.sol:import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';
contracts/MyToken.sol:import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
contracts/MyToken.sol:import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol';
```

The reason we have `zeppelin/*` contracts locally rather than importing from NPM is that they are as follows.

- `zeppelin/lifecycle/Destructible.sol` no longer exists on openzeppelin repo
- `zeppelin/lifecycle/Ownable.sol` has code changed (`owner` field is changed from `private` to `public`)

### Some decision behind the architectural choice.

#### Deploying each contract per event.

A new contract needs to be deployed for each event, which incurs some cost at each deploy.
This makes it relatively expensive to use for a small number of participant especially when the gas price or Ether price is expensive. However, this will allow us to constantly update and refactor the contract to be up to date without having complex upgradability strategy.

#### No strict time dependencies.

The current contract does not contain any information about the event start and ends time as real events often do not have strict deadlines on participation. Also, the current unstable nature of Ethereum mainnet occasionally make it difficult (or too expensive) to interact with the contract in a timely manner so it often comes down to the event owner to decide when it ends the event. The only exception is `cooling period` which last for a week by default. Having the cooling period is mainly to encourage users to withdraw deposits as soon as possible so that users can avoid possible loss of funds if any bugs or vulnerabilities are found (or the deployment account is compromised). Please refer to [this blog post](https://medium.com/@makoto_inoue/running-everyday-dapp-when-ethereum-is-under-pressure-2c5bf4412c13) for the user impact when Ethereum network is under performance pressure.

#### Pull over Push

The users need to interact with the smart contract twice, at registration and at withdrawal. The need to manually withdraw fund is an inconvenience to the users but this is to avoid the potential reentrancy attack. Please refer to [this blog post](https://medium.com/@makoto_inoue/a-smartcontract-best-practice-push-pull-or-give-b2e8428e032a) for how this decision was made.

We are planning to transaition into [a model where user commitment is always stored in their pot so that they do not have to withdraw every time the event ends](https://github.com/wearekickback/KIPs/blob/master/kips/kip-1.md)

### Past vulnabilities

Please refer to [BlockParty version 0.8.4 pre auditing guide.](https://github.com/wearekickback/contracts/blob/master/doc/SelfAuditV084.md)


