import { toWei, fromWei, toBN } from 'web3-utils'
import { calculateFinalizeMaps } from '@wearekickback/shared'
const moment = require('moment');
const fs = require('fs');

const gasPrice = toWei('1', 'gwei')

const { mulBN } = require('../utils')
const EthVal = require('ethval')

const usd = 468;

let trx, result, trxReceipt;

const pad = function(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

const getTransaction = async function(type, transactionHash){
  trx = await web3.eth.getTransaction(transactionHash)
  trxReceipt = await web3.eth.getTransactionReceipt(transactionHash)
  const gasPrice = toBN(trx.gasPrice)
  const gasUsed = toBN(trxReceipt.gasUsed)
  const gasTotal = gasUsed.mul(gasPrice)
  result = {
    'type             ': type,
    'gasUsed       ': gasUsed,
    'gasPrice': fromWei(gasPrice,'gwei'),
    '1ETH*USD': usd,
    'gasUsed*gasPrice(Ether)': fromWei(gasTotal,'ether'),
    'gasUsed*gasPrice(USD)': fromWei(gasTotal,'ether') * usd,
  }
  return result;
}

const formatArray = function(array){
  return array.join("\t\t")
}

const reportTest = async function (participants, ctx, finalize){
  const { accounts , createConference, getBalance, register } = ctx
  const addresses = [];
  const transactions = [];
  const owner = accounts[0];

  const conference = await createConference({
    limitOfParticipants:participants
  });
  transactions.push(await getTransaction('create   ', conference.transactionHash))
  const deposit = await conference.deposit()

  for (var i = 0; i < participants; i++) {
    var registerTrx = await register({conference, deposit, user:accounts[i], owner})
    if ((i % 100) == 0 && i != 0) {
      console.log('register', i)
    }
    if (i == 0) {
      transactions.push(await getTransaction('register', registerTrx.tx))
    }
    addresses.push(accounts[i]);
  }
  await conference.registered().should.eventually.eq(participants)
  var contractBalance  = (await getBalance(conference.address))
  var exptectedBalance = new EthVal(mulBN(deposit, participants))
  contractBalance.toString().should.eq(exptectedBalance.toString())
  await finalize({
    deposit, conference, owner, addresses, transactions
  })
  for (var i = 0; i < participants; i++) {
    trx = await conference.withdraw({from:accounts[i], gasPrice:gasPrice});
    if (i == 0) {
      transactions.push(await getTransaction('withdraw', trx.tx))
    }
  }
  var header = Object.keys(transactions[0]).join("\t");
  var bodies = [header]
  console.log(header)
  for (var i = 0; i < transactions.length; i++) {
    var row = formatArray(Object.values(transactions[i]));
    console.log(row);
    bodies.push(row);
  }
  var date = moment().format("YYYYMMDD");
  fs.writeFileSync(`./log/stress_${pad(participants, 4)}.log`, bodies.join('\n') + '\n');
  fs.writeFileSync(`./log/stress_${pad(participants, 4)}_${date}.log`, bodies.join('\n') + '\n');
}

const reportFinalize = async (participants, ctx) => {
  return reportTest(participants, ctx, async ({ deposit, conference, owner, addresses, transactions }) => {
    const numRegistered = addresses.length;
    const ps = []

    // build bitmaps
    for (let i = 0; numRegistered > i; i += 1) {
      ps.push({
        index: i,
        status: 'SHOWED_UP'
      })
    }
    const maps = calculateFinalizeMaps(ps)    
    const finalizeTx = await conference.finalize(maps, { from:owner, gasPrice:gasPrice })
    transactions.push(await getTransaction('finalize  ', finalizeTx.tx))
  })
}

function shouldStressTest () {
  let ctx;
  beforeEach(async function(){
    ctx = this;
  })

  describe('2 participants', function() {
    const num = 2

    it('finalize', async function(){
      await reportFinalize(num, ctx)
    })
  })

  describe('300 participants', function() {
    const num = 300

    it('finalize', async function(){
      await reportFinalize(num, ctx)
    })
  })
};

module.exports = {
  shouldStressTest
};
