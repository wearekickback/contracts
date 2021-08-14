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
  await deployer.deploy('My event', 0, 0, 0, oneweek, owneraddress, tokenaddress)

  const events = await promisify(deployer.contract.getPastEvents, deployer.contract)('NewParty')

  const { returnValues: { deployedAddress } } = events.pop()

  console.log(`New party contract deployed at: ${deployedAddress}`)
}
```

## Dev guide

Pre-requisites:

- [Node 8.12+](https://nodejs.org/)
- [Yarn](https://yarnpkg.com)
- [Ganache CLI v6.7.0 or above](https://www.npmjs.com/package/ganache-cli)

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


## Docker

### Pre-requisite

- Start ganache with `ganache-cli -m mnemonic`
- Clear data dir with `rm -rf data`

### Run


- `docker-compose up`

Once you show message like this, then it was abile to create contract and deploy the graph successfully.

`
Deployed to http://graph:8000/subgraphs/name/wearekickback/kickback/graphql
`

Then followed by these graph-node messages actually indexing

```
graph        | Apr 08 22:12:12.170 INFO 1 trigger found in this block for this subgraph, block_hash: 0x6b457bafbafb78566c519e6f30b00890836144d1afc687f9cdf147c7164c4c1a, block_number: 4, subgraph_id: QmeYWpZq5Ujkg4dKo6YJbBXSt5L36U4jGG9KMh9o7LpfYi, component: SubgraphInstanceManager
graph        | Apr 08 22:12:12.173 WARN *** handleNewParty, data_source: Deployer, block_hash: 0x6b457bafbafb78566c519e6f30b00890836144d1afc687f9cdf147c7164c4c1a, block_number: 4, subgraph_id: QmeYWpZq5Ujkg4dKo6YJbBXSt5L36U4jGG9KMh9o7LpfYi, component: SubgraphInstanceManager
graph        | Apr 08 22:12:12.176 WARN *** 1 Address: 0xbc4bac580b299e1a141df02b2bbe6ea80b03f41f, Block number: 4, block hash: 0x6b457bafbafb78566c519e6f30b00890836144d1afc687f9cdf147c7164c4c1a, transaction hash: 0xeabbfcd5663ddf17792490eae887832c2c81250786e85e77da27335fef61dad2, data_source: Deployer, block_hash: 0x6b457bafbafb78566c519e6f30b00890836144d1afc687f9cdf147c7164c4c1a, block_number: 4, subgraph_id: QmeYWpZq5Ujkg4dKo6YJbBXSt5L36U4jGG9KMh9o7LpfYi, component: SubgraphInstanceManager
graph        | Apr 08 22:12:12.179 WARN ****2 , data_source: Deployer, block_hash: 0x6b457bafbafb78566c519e6f30b00890836144d1afc687f9cdf147c7164c4c1a, block_number: 4, subgraph_id: QmeYWpZq5Ujkg4dKo6YJbBXSt5L36U4jGG9KMh9o7LpfYi, component: SubgraphInstanceManager
graph        | Apr 08 22:12:12.181 INFO Create data source, params: 0xbc4bac580b299e1a141df02b2bbe6ea80b03f41f, name: Party, block_hash: 0x6b457bafbafb78566c519e6f30b00890836144d1afc687f9cdf147c7164c4c1a, block_number: 4, subgraph_id: QmeYWpZq5Ujkg4dKo6YJbBXSt5L36U4jGG9KMh9o7LpfYi, component: SubgraphInstanceManager
graph        | Apr 08 22:12:12.181 WARN ****3 , data_source: Deployer, block_hash: 0x6b457bafbafb78566c519e6f30b00890836144d1afc687f9cdf147c7164c4c1a, block_number: 4, subgraph_id: QmeYWpZq5Ujkg4dKo6YJbBXSt5L36U4jGG9KMh9o7LpfYi, component: SubgraphInstanceManager
graph        | Apr 08 22:12:12.182 WARN ****4 , data_source: Deployer, block_hash: 0x6b457bafbafb78566c519e6f30b00890836144d1afc687f9cdf147c7164c4c1a, block_number: 4, subgraph_id: QmeYWpZq5Ujkg4dKo6YJbBXSt5L36U4jGG9KMh9o7LpfYi, component: SubgraphInstanceManager
graph        | Apr 08 22:12:12.210 WARN ****5 , data_source: Deployer, block_hash: 0x6b457bafbafb78566c519e6f30b00890836144d1afc687f9cdf147c7164c4c1a, block_number: 4, subgraph_id: QmeYWpZq5Ujkg4dKo6YJbBXSt5L36U4jGG9KMh9o7LpfYi, component: SubgraphInstanceManager
graph        | Apr 08 22:12:12.211 WARN ****6 , data_source: Deployer, block_hash: 0x6b457bafbafb78566c519e6f30b00890836144d1afc687f9cdf147c7164c4c1a, block_number: 4, subgraph_id: QmeYWpZq5Ujkg4dKo6YJbBXSt5L36U4jGG9KMh9o7LpfYi, component: SubgraphInstanceManager
graph        | Apr 08 22:12:12.211 WARN ****7 , data_source: Deployer, block_hash: 0x6b457bafbafb78566c519e6f30b00890836144d1afc687f9cdf147c7164c4c1a, block_number: 4, subgraph_id: QmeYWpZq5Ujkg4dKo6YJbBXSt5L36U4jGG9KMh9o7LpfYi, component: SubgraphInstanceManager
graph        | Apr 08 22:12:12.235 WARN ****9 0x0000000000000000000000000000000000000000 0xbc4bac580b299e1a141df02b2bbe6ea80b03f41f, data_source: Deployer, block_hash: 0x6b457bafbafb78566c519e6f30b00890836144d1afc687f9cdf147c7164c4c1a, block_number: 4, subgraph_id: QmeYWpZq5Ujkg4dKo6YJbBXSt5L36U4jGG9KMh9o7LpfYi, component: SubgraphInstanceManager
graph        | Apr 08 22:12:12.237 WARN ****000203 0x0000000000000000000000000000000000000000 , 0xbc4bac580b299e1a141df02b2bbe6ea80b03f41f, data_source: Deployer, block_hash: 0x6b457bafbafb78566c519e6f30b00890836144d1afc687f9cdf147c7164c4c1a, block_number: 4, subgraph_id: QmeYWpZq5Ujkg4dKo6YJbBXSt5L36U4jGG9KMh9o7LpfYi, component: SubgraphInstanceManager
graph        | Apr 08 22:12:12.260 INFO Done processing Ethereum trigger, waiting_ms: 0, handler: handleNewParty, total_ms: 90, trigger_type: Log, address: 0xd8f3…3dbe, signature: NewParty(indexed address,indexed address), block_hash: 0x6b457bafbafb78566c519e6f30b00890836144d1afc687f9cdf147c7164c4c1a, block_number: 4, subgraph_id: QmeYWpZq5Ujkg4dKo6YJbBXSt5L36U4jGG9KMh9o7LpfYi, component: SubgraphInstanceManager
graph        | Apr 08 22:12:12.305 INFO Applying 12 entity operation(s), block_hash: 0x6b457bafbafb78566c519e6f30b00890836144d1afc687f9cdf147c7164c4c1a, block_number: 4, subgraph_id: QmeYWpZq5Ujkg4dKo6YJbBXSt5L36U4jGG9KMh9o7LpfYi, component: SubgraphInstanceManager
graph        | Apr 08 22:12:26.999 WARN Possible contention in DB connection pool, wait_ms: 10, component: Store

```

`http://graph:8000` is hostname only used within docker. To access from your machine, just connect via http://localhost:8000/subgraphs/name/wearekickback/kickback/graphql

The deployment will create a dummy event. If you run the following query and returns an entry, then indexing should have worked.

```
query{
  partyEntities(first:5){
    id
  }
}
```

After this, you have to manually update deployer address at `app` and `server` to `0xD8F3257ea8E50bf78B2d950A1949f5d94d613DBe`(this will be always the same as long as you start up ganache with `-m mnemonic`)

#### Creating and pushing new docker image.

When you update `contract` or `kickback-subgraph` you should update new images.

```
yarn docker:deploy
```

Once this is pushed, remove the existing image with `docker image rm $IMAGEID` and try `docker-compose up` again 


### Troubleshoot

#### no such image

If the following message appears, simply press "Y"

```
ERROR: for contracts  no such image: sha256:da60023afedd7dc105eaa927ee47ca761c850be205b869c9986ed047f9603354: No such image: sha256:da60023afedd7dc105eaa927ee47ca761c850be205b869c9986ed047f9603354
Creating graph                ... done

ERROR: for contracts  no such image: sha256:da60023afedd7dc105eaa927ee47ca761c850be205b869c9986ed047f9603354: No such image: sha256:da60023afedd7dc105eaa927ee47ca761c850be205b869c9986ed047f9603354
ERROR: The image for the service you're trying to recreate has been removed. If you continue, volume data could be lost. Consider backing up your data before continuing.

Continue with the new image? [yN]y
```

#### timeout occurred after waiting 15 seconds for graph:8020

```
contracts    | wait-for-it.sh: waiting 15 seconds for graph:8020
contracts    | wait-for-it.sh: timeout occurred after waiting 15 seconds for graph:8020
```

This means graph-node is not properly up and running.

If you scroll up the log, you may see the following error.

```
graph        | Apr 07 20:43:52.131 INFO Connected to Ethereum, network_version: 1586292225353, network: mainnet
graph        | Apr 07 20:43:52.151 INFO Waiting for other graph-node instances to finish migrating, component: Store
graph        | Apr 07 20:43:52.153 INFO Running migrations, component: Store
graph        | Apr 07 20:43:52.215 INFO Migrations finished, component: Store
graph        | Apr 07 20:43:52.215 INFO Completed pending Postgres schema migrations, component: Store
graph        | thread 'tokio-runtime-worker' panicked at 'Ethereum node provided net_version 1586292225353, but we expected 1586291081321. Did you change networks without changing the network name?', store/postgres/src/store.rs:245:21
```

When this happens, do the following

- Stop the service (CMD+C)
- `rm -rf data`
- Restart ganache with some random network id (eg: `ganache-cli -m mnemonic -i 12345`). This actually happened quite a lot to me so you may have to retry a couple of times.
- Start again with `docker-compose up`


## Simulation

** NOTE: This is currently not up to date so more likely not working **

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

  -a, --address <address>  Address of party (obtain from UI /create page)
  -n, --network <network>  Name of the network (e.g. ropsten, mainnet, etc.)
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

Edit `.deployment.js` and fill in the company mnemonic, Infura key (obtain from 1Password) and Etherscan key (obtain from 1Password).

Releases are done automatically via CI. Prior to doing a release, ensure the
latest compiled contracts have been deployed to both test nets and the `mainnet`:

```
$ yarn deploy:ropsten
$ yarn deploy:rinkeby
$ yarn deploy:kovan
$ yarn deploy:mainnet
```

Once contracts are deployed to public network, run the verify script to verify the source code on Etherscan.

```
truffle run verify Deployer --network ropsten
truffle run verify Deployer --network rinkeby
truffle run verify Deployer --network kovan
truffle run verify Deployer --network mainnet
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

- Event organiser = the creator of the event contract. There is only one per event.
- Event admins = the people who can help the event organiser. Can do everything the organiser can do apart from transfering the contract ownership and destroying the event contract deployer contract.
- Participants = People who RSVPed the event
- Attendees = People who were marked as attended

### Event flow

- When the event organiser creates an event, the organiser can specify the unit of currency (ETH or ERC20), name of the event(`name`), amount of commitment (`deposit`), event capaicty (`limitOfParticipants`), and cooling period (`cooling period`) when users can withdraw their commitment.
- The event organiser adds admins
- Until the first participant RSVP, the event admins can change the name and `deposit` amount
- The event admins can change limitOfParticipants to increase the capacity of the event.
- When participants RSVP, they can RSVP if they call `register` function with the correct `deposit` value.
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
- Due to the gas size exceeding the block size, the actual binaries of the contracts are deployed via `ERC20Deployer.sol` and `EthDeployer.sol` and their deployed contract addresses are passed into the constructor of `Deployer.sol`. The `Deployer.sol` determines whether it should deploy ERC20 version if contract address is passed. Otherwise it will deploy the Eth version.
- For ERC20 token contracts, we import the openzeppelin library.

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

We have made certain architectual deciisions which may seem suboptimal to people who look into the code for the first time. The following section covers context behind why we made such decisions.

#### Deploying each contract per event.

A new contract needs to be deployed for each event, which incurs some cost at each deploy.
This makes it relatively expensive to use for a small number of participant especially when the gas price or Ether price is expensive. However, this will allow us to constantly update and refactor the contract to be up to date without having complex upgradability strategy.

As our contract matures we would like to transition to a model where one contract holds multiple events and make certain logics pluggable/upgradable.

#### No strict time dependencies.

The current contract does not contain any information about the event start and end time as real events often do not have strict deadlines on participation. Also, the current unstable nature of Ethereum mainnet occasionally makes it difficult (or too expensive) to interact with the contract in a timely manner so it often comes down to the event owner to decide when one ends the event. The only exception is `cooling period` which lasts for a week by default. Having the cooling period is mainly to encourage users to withdraw deposits as soon as possible so that users can avoid possible loss of funds if any bugs or vulnerabilities are found (or the deployment account is compromised). Please refer to [this blog post](https://medium.com/@makoto_inoue/running-everyday-dapp-when-ethereum-is-under-pressure-2c5bf4412c13) for the user impact when the Ethereum network is under performance pressure.

#### Pull over Push

The users need to interact with the smart contract twice, at registration and at withdrawal. The need to manually withdraw fund is an inconvenience to the users but this is to avoid the potential reentrancy attack. Please refer to [this blog post](https://medium.com/@makoto_inoue/a-smartcontract-best-practice-push-pull-or-give-b2e8428e032a) for how this decision was made.

We are planning to transaition into [a model where user commitment is always stored in their pot so that they do not have to withdraw every time the event ends](https://github.com/wearekickback/KIPs/blob/master/kips/kip-1.md)

### Past vulnerabilities

Please refer to [BlockParty version 0.8.4 pre auditing guide.](https://github.com/wearekickback/contracts/blob/master/doc/SelfAuditV084.md)


## Deployed contracts

For all the latest deployed deployer contracts, see refer to `deployedAddresses.json`

### Mainnet deployer contract revisions

- npm version 1.2.9 "0x3361aa92E426E052141Daf9e41A09d36e994Ba23"
- npm version 1.2.0 "0x5cD26E6DC8200630508672fF5C726478e08Da52B" (contained a bug so aborted)
- npm version 1.0.x "0x0F84461931866cFB2796E09B20520847D49F80F2"

### xDai deployer contract versions

- npm version @wearekickback/contracts-integration 1.4.0 "0x05E9AE465727AAa78De8F761E44D78b43a5d9697"

### Polygon deployer contract versions

- "0xc1d24FB1a9c6b5051c28b0e963473D3cE3EB3491"
