// ----------------------------------------------------------------------------
// Eximchain Unit Test Utilities
//
// Copyright (c) 2017 Eximchain Pte. Ltd.
// http://www.eximchain.com/
//
// The MIT Licence.
// ----------------------------------------------------------------------------

const TestLib = require('../../tools/testlib.js')
const StdUtils = require('../Enuma/lib/StdTestUtils.js')


module.exports.checkBurn = (receipt, account, amount) => {

   TestLib.checkStatus(receipt)

   assert.equal(Object.keys(receipt.events).length, 1)
   assert.equal(typeof receipt.events.TokensBurnt, 'object')
   const eventArgs = receipt.events.TokensBurnt.returnValues
   assert.equal(Object.keys(eventArgs).length, 4)
   assert.equal(eventArgs._account, account)
   assert.equal(eventArgs._amount, amount)
}


module.exports.checkFreeze = (receipt) => {

   TestLib.checkStatus(receipt)

   assert.equal(Object.keys(receipt.events).length, 1)
   assert.equal(typeof receipt.events.Frozen, 'object')
   const eventArgs = receipt.events.Frozen.returnValues
   assert.equal(Object.keys(eventArgs).length, 0)
}


module.exports.checkUpdateWhitelist = (receipt, account, _status) => {

   TestLib.checkStatus(receipt)

   assert.equal(Object.keys(receipt.events).length, 1)
   assert.equal(typeof receipt.events.WhitelistUpdated, 'object')
   const eventArgs = receipt.events.WhitelistUpdated.returnValues
   assert.equal(Object.keys(eventArgs).length, 4)
   assert.equal(eventArgs._account, account)

   if (_status == false) {
      // Workaround deserialization issue in web3
      assert.isTrue(eventArgs._status === false || eventArgs._status === null)
   } else {
      assert.equal(eventArgs._status, _status)
   }
}


module.exports.checkUpdateWhitelistBatch = (receipt, accounts, _status) => {

   TestLib.checkStatus(receipt)

   assert.equal(Object.keys(receipt.events).length, 1)
   assert.equal(typeof receipt.events.WhitelistUpdated, 'object')
   const eventsArray = receipt.events.WhitelistUpdated
   assert.equal(eventsArray.length, accounts.length)

   for (i = 0; i < accounts.length; i++) {
      const e = eventsArray[i]

      assert.equal(e.event, 'WhitelistUpdated')
      assert.equal(Object.keys(e.returnValues).length, 4)
      assert.equal(e.returnValues._account, accounts[i])

      if (_status == false) {
         // Workaround deserialization issue in web3
         assert.isTrue(e.returnValues._status === false || e.returnValues._status === null)
      } else {
         assert.equal(e.returnValues._status, _status)
      }
   }
}


