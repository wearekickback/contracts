module.exports = {
  accounts: 350,
  norpc: true,
  testrpcOptions: '--defaultBalanceEther 2000000 --gasLimit 0xfffffffffff',
  testCommand: '../node_modules/.bin/babel-node ../node_modules/.bin/truffle test --network coverage test/group_admin.js',
  skipFiles: ['zeppelin/lifecycle/Destructible.sol','zeppelin/ownership/Ownable.sol']
};
