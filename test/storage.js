import _ from 'lodash'
import EthVal from 'ethval'
import { sha3 } from 'web3-utils'

import { ADDRESS_ZERO, BYTES32_ZERO } from './utils'

const Storage = artifacts.require("Storage.sol")

const LARGE_NUMBER_STR = new EthVal('123.4', 'eth').toWei().toString(10)

contract.only('Storage', accounts => {
  const writerRoleAddress = accounts[1]
  const secondAdminRoleAddress = accounts[2]
  const anonRoleAddress = accounts[3]
  const dataAddress = accounts[4]

  const setterValueArgs = v => v instanceof Array ? [v, v.length] : [v]

  let storage

  beforeEach(async () => {
    storage = await Storage.new()
  })

  describe('get/set/override', () => {
    ;[
      { type: 'address', value0: ADDRESS_ZERO, value1: writerRoleAddress, value2: secondAdminRoleAddress },
      { type: 'string', value0: '', value1: 'test1', value2: 'test2' },
      { type: 'bytes32', value0: BYTES32_ZERO, value1: sha3('test1'), value2: sha3('test2') },
      { type: 'uint', value0: 0, value1: 1, value2: LARGE_NUMBER_STR },
      { type: 'bool', value0: false, value1: true, value2: false },
      { type: 'addressList', value0: [], value1: [secondAdminRoleAddress, anonRoleAddress], value2: [writerRoleAddress] },
      { type: 'bytes32List', value0: [], value1: [sha3('t1'), sha3('t2')], value2: [sha3('t3')] },
      { type: 'uintList', value0: [], value1: [12, 34], value2: [LARGE_NUMBER_STR] },
      { type: 'boolList', value0: [], value1: [true, false], value2: [false] },
    ].forEach(({ type, value0, value1, value2 }) => {
      it(type, async () => {
        const getMethod = `get${_.upperFirst(type)}`
        const setMethod = `set${_.upperFirst(type)}`
        const key = sha3(getMethod + setMethod)

        await storage[getMethod](dataAddress, key).should.eventually.eq(value0)
        await storage[setMethod](dataAddress, key, ...setterValueArgs(value1))
        await storage[getMethod](dataAddress, key).should.eventually.eq(value1)
        await storage[setMethod](dataAddress, key, ...setterValueArgs(value2))
        await storage[getMethod](dataAddress, key).should.eventually.eq(value2)
      })
    })
  })

  describe('auth', () => {
    let ADMIN_ROLE
    let WRITER_ROLE

    beforeEach(async () => {
      ADMIN_ROLE = await storage.ROLE_ADMIN.call()
      WRITER_ROLE = await storage.ROLE_WRITER.call()

      await storage.adminAddRole(writerRoleAddress, WRITER_ROLE)
      await storage.adminAddRole(secondAdminRoleAddress, ADMIN_ROLE)
    })

    it('lets another admin add a new admin', async () => {
      await storage.adminAddRole(writerRoleAddress, ADMIN_ROLE, { from: secondAdminRoleAddress })

      const key = sha3('key')
      await storage.setString(dataAddress, key, 'test1', { from: writerRoleAddress })
    })

    it('does not let anon add a new role', async () => {
      await storage.adminAddRole(writerRoleAddress, WRITER_ROLE, { from: anonRoleAddress }).should.be.rejected
      await storage.adminAddRole(writerRoleAddress, ADMIN_ROLE, { from: anonRoleAddress }).should.be.rejected
    })

    it('does not let writer add a new admin', async () => {
      await storage.adminAddRole(anonRoleAddress, WRITER_ROLE, { from: writerRoleAddress }).should.be.rejected
      await storage.adminAddRole(anonRoleAddress, ADMIN_ROLE, { from: writerRoleAddress }).should.be.rejected
    })

    ;[
      { type: 'address', value: secondAdminRoleAddress },
      { type: 'string', value: 'test2' },
      { type: 'bytes32', value: sha3('test2') },
      { type: 'uint', value: LARGE_NUMBER_STR },
      { type: 'bool', value: true },
      { type: 'addressList', value: [secondAdminRoleAddress, anonRoleAddress] },
      { type: 'bytes32List', value: [sha3('t1'), sha3('t2')] },
      { type: 'uintList', value: [12, 34] },
      { type: 'boolList', value: [true, false] },
    ].forEach(({ type, value }) => {
      describe(type, () => {
        let getMethod
        let setMethod
        let key

        beforeEach(() => {
          getMethod = `get${_.upperFirst(type)}`
          setMethod = `set${_.upperFirst(type)}`
          key = sha3(getMethod + setMethod)
        })

        it(`lets anon read a: ${type}`, async () => {
          await storage[setMethod](dataAddress, key, ...setterValueArgs(value))
          await storage[getMethod](dataAddress, key, { from: anonRoleAddress }).should.eventually.eq(value)
        })

        it(`does not let anon write a: ${type}`, async () => {
          await storage[setMethod](dataAddress, key, ...setterValueArgs(value).concat({ from: anonRoleAddress })).should.be.rejected
        })

        it(`lets a writer write a: ${type}`, async () => {
          await storage[setMethod](dataAddress, key, ...setterValueArgs(value).concat({ from: writerRoleAddress }))
        })

        it(`lets another admin write a: ${type}`, async () => {
          await storage[setMethod](dataAddress, key, ...setterValueArgs(value).concat({ from: secondAdminRoleAddress }))
        })
      })
    })
  })
})
