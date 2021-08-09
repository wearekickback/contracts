const toBN = require('web3-utils').toBN
const chai = require('chai')
const chaiString = require('chai-string')
const chaiAsPromised = require('chai-as-promised')

chai.use((_chai, utils) => {
  utils.addMethod(_chai.Assertion.prototype, 'eq', function (val) {
    let result = utils.flag(this, 'object')

    // if bignumber
    if (result.toNumber) {
      if (val.toNumber) {
        result = result.toString(16)
        val = val.toString(16)
      }
      else if (typeof val === 'string') {
        if (val.startsWith('0x')) {
          result = result.toString(16)
        } else {
          result = result.toString(10)
        }
      }
      else if (typeof val === 'number') {
        result = result.toNumber()
      }
    }

    return (utils.flag(this, 'negate'))
      ? new _chai.Assertion(result).to.not.be.equal(val)
      : new _chai.Assertion(result).to.be.equal(val)
  })
})

chai.use(chaiString)
chai.use(chaiAsPromised)

chai.should()

const getBalance = async addr => toBN(await web3.eth.getBalance(addr))

// mul + div by 1000 takes care of upto 3 decimal places (since toBN() doesn't support decimals)
const mulBN = (bn, factor) => bn.mul( toBN(factor * 1000) ).div( toBN(1000) )

const getEvents = async (result, eventName) => {
  const events = result.logs.filter(({ event }) => event === eventName)

  assert.isTrue(events.length > 0)

  return events
}

const outputBNs = bn => {
  console.log('BNs: ');
  Object.keys(bn).forEach(k => {
    console.log(`   ${bn[k].toString(10)} => ${bn[k].toString(2)}`)
  })
}

module.exports = {
  getBalance,
  mulBN,
  getEvents,
  outputBNs
}