import _ from 'lodash'
import EthVal from 'ethval'
import { sha3 } from 'web3-utils'

import { ADDRESS_ZERO, BYTES32_ZERO } from './utils'

const Storage = artifacts.require("Storage.sol")

contract('Storage', accounts => {
  const writerRoleAddress = accounts[1]
  const secondAdminRoleAddress = accounts[2]
  const anonRoleAddress = accounts[3]
  const dataAddress = accounts[4]

  let storage

  beforeEach(async () => {
    storage = await Storage.new()

    const ADMIN_ROLE = await storage.ROLE_ADMIN
    const WRITER_ROLE = await storage.ROLE_WRITER

    await storage.adminAddRole(writerRoleAddress, WRITER_ROLE)
    await storage.adminAddRole(secondAdminRoleAddress, ADMIN_ROLE)
  })

  describe.only('get/set', () => {
    ;[
      { type: 'address', value0: ADDRESS_ZERO, value1: writerRoleAddress, value2: secondAdminRoleAddress },
      { type: 'string', value0: '', value1: 'test1', value2: 'test2' },
      { type: 'bytes32', value0: BYTES32_ZERO, value1: sha3('test1'), value2: sha3('test2') },
      { type: 'uint', value0: 0, value1: 1, value2: new EthVal('123.4', 'eth').toWei().toString(10) },
      { type: 'bool', value0: false, value1: true, value2: false },
    ].forEach(({ type, value0, value1, value2 }) => {
      it(type, async () => {
        const methodSuffix = _.capitalize(type)
        const key = sha3(methodSuffix)

        await storage[`get${methodSuffix}`](dataAddress, key).should.eventually.eq(value0)
        await storage[`set${methodSuffix}`](dataAddress, key, value1)
        await storage[`get${methodSuffix}`](dataAddress, key).should.eventually.eq(value1)
        await storage[`set${methodSuffix}`](dataAddress, key, value2)
        await storage[`get${methodSuffix}`](dataAddress, key).should.eventually.eq(value2)
      })
    })
  })
})
