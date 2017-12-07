// ----------------------------------------------------------------------------
// Eximchain Whitelist Update Script
//
// Copyright (c) 2017 Eximchain Pte. Ltd.
// http://www.eximchain.com/
// The MIT Licence.
//
// Based on whitelisting scripts from Enuma Technologies.
// Copyright (c) 2017 Enuma Technologies
// https://www.enuma.io/
// ----------------------------------------------------------------------------

const fs        = require('fs')
const Path      = require('path')
const Web3      = require('web3')
const Chai      = require('chai')
const BigNumber = require('bignumber.js')
const assert    = Chai.assert
const Moment    = require('moment')


//
// Configuration
//
const config               = JSON.parse(fs.readFileSync('../config.json'))
const web3Url              = config.web3Url
const tokenAbiFilePath     = '../build/EximchainToken.abi'
const saleAbiFilePath      = '../build/EximchainTokenSale.abi'
const opsAddress           = '0xb0030C1cC4b979EE749E71B17C082b915Dcd3c92'
const saleContractAddress  = '0x5eB79615b559068283567D11171278CFA9D89272'
const tokenContractAddress = '0xb6516D21a57Cf0011cA81Ae4016e663DDf13bC83'
const tokenSymbol          = 'EXC'
const maxBatchSize         = 30 // Careful to not exceed the maximum gas per block


const web3 = new Web3(new Web3.providers.HttpProvider(web3Url))



//
// Main function to process the whitelist
//
async function run() {

   if (process.argv.length !== 3) {
      console.log("Usage: node updateWhitelist.js whitelist.json")
      process.exit(1)
   }

   const whitelistFilePath = Path.resolve(process.argv[2])

   if (fs.existsSync(whitelistFilePath) !== true) {
      console.log("Could not find whitelist file at: " + whitelistFilePath)
      process.exit(1)
   }

   // Load the whitelist
   const whitelist = JSON.parse(fs.readFileSync(whitelistFilePath))
   console.log("Whitelist loaded with " + whitelist.length + " entries.")

   // Load the sale contract ABI.
   const tokenAbi = JSON.parse(fs.readFileSync(tokenAbiFilePath).toString());
   const saleAbi  = JSON.parse(fs.readFileSync(saleAbiFilePath).toString());

   // Set default options (e.g. maximum gas allowed for transactions).
   const options = {
      gas : '4700000'
   }

   // Get sale and token contract instances.
   const sale  = new web3.eth.Contract(saleAbi, saleContractAddress, options)
   const token = new web3.eth.Contract(tokenAbi, tokenContractAddress, options)

   // Do some checks to make sure we are talking to the right contract.
   assert.equal(await sale.methods.token().call(), tokenContractAddress)
   assert.equal(await token.methods.symbol().call(), tokenSymbol)

   if (!whitelist || whitelist.length == 0) {
      console.log('Invalid or empty whitelist file')
      system.exit(1)
   }

   // Do a quick sanity check on the whitelist
   for (var i = 0; i < whitelist.length; i++) {
      if (web3.utils.isAddress(whitelist[i].address) !== true) {
         console.log('Whitelist entry at index ' + i + ' has invalid address ' + whitelist[i].address)
         system.exit(1)
      }

      if (typeof whitelist[i].status !== 'boolean') {
         console.log('Whitelist entry at index ' + i + ' and address ' + whitelist[i].address + ' has invalid status.')
         system.exit(1)
      }
   }

   //await updateWhitelist1By1(sale, whitelist)
   await updateWhitelistBatch(sale, whitelist)

   console.log('All whitelist entries processed successfully.')
}



async function updateWhitelist1By1(sale, whitelist) {

   for (var i = 0; i < whitelist.length; i++) {
      const _address = whitelist[i].address
      const _status  = whitelist[i].status

      // Check if the status needs to be changed
      const existingStatus = await sale.methods.whitelist(_address).call()

      if (_status === existingStatus) {
         console.log('[=] ' + _address + ' (already ' + _status + ')')
         continue
      }

      // Just do a sanity check first to make sure everything is ok. It should return true.
      assert.equal(await sale.methods.updateWhitelist(_address, true).call({ from: opsAddress }), true)

      // Send the transaction to the blockchain.
      const receipt = await sale.methods.updateWhitelist(_address, _status).send({ from: opsAddress })

      // Make sure the receipt looks correct
      assert.equal(receipt.events.WhitelistUpdated.event, "WhitelistUpdated")
      assert.equal(receipt.events.WhitelistUpdated.returnValues._account, _address)

      // Verify the whitelisted state in the sale contract
      if (_status === true) {
         assert.equal(receipt.events.WhitelistUpdated.returnValues._status, _status)
         assert.equal(await sale.methods.whitelist(_address).call(), _status)
         console.log('[+] ' + _address)
      } else {
         const eventStatus = receipt.events.WhitelistUpdated.returnValues._status
         assert.isTrue(eventStatus === null || eventStatus === false, "Event status not as expected")

         const actualStatus = await sale.methods.whitelist(_address).call()
         assert.isTrue(actualStatus === null || actualStatus === false, "Whitelist status not as expected")
         console.log('[-] ' + _address)
      }

      console.log(receipt)
   }
}


async function updateWhitelistBatch(sale, whitelist) {

   // First, we separate addresses to add and to remove from the whitelist
   var toAdd    = []
   var toRemove = []
   var toSkip   = []

   var i = 0
   for (i = 0; i < whitelist.length; i++) {
      // Check if the status needs to be changed
      var existingStatus = await sale.methods.whitelist(whitelist[i].address).call()
      if (existingStatus === null) {
         existingStatus = false
      }

      const _status = whitelist[i].status

      if (_status === existingStatus) {
         toSkip.push(whitelist[i])
      } else if (_status === true) {
         toAdd.push(whitelist[i])
      } else {
         toRemove.push(whitelist[i])
      }
   }

   console.log('')
   console.log("Found " + toAdd.length + " address(es) to ADD, " + toRemove.length + " to REMOVE and " + toSkip.length + " to leave unchanged.")

   if (toAdd.length > 0) {
      console.log('')
      console.log('------------------------------------------------')
      console.log('                     ADDED')
      console.log('------------------------------------------------')
      await updateWhitelistBatchInternal(sale, toAdd, 'add')
   }

   if (toRemove.length > 0) {
      console.log('')
      console.log('------------------------------------------------')
      console.log('                    REMOVED')
      console.log('------------------------------------------------')
      await updateWhitelistBatchInternal(sale, toRemove, 'remove')
   }

   if (toSkip.length > 0) {
      console.log('')
      console.log('------------------------------------------------')
      console.log('                   UNCHANGED')
      console.log('------------------------------------------------')
      for (i = 0; i < toSkip.length; i++) {
         console.log('[=] ' + toSkip[i].address + ' (already ' + toSkip[i].status + ')')
      }
   }

   console.log('')
}


async function updateWhitelistBatchInternal(sale, whitelist, action) {

   // Break the list of addresses into batches
   var batches = []
   var tempArray = whitelist.slice()
   while (tempArray.length > 0) {
      const batch = tempArray.splice(0, maxBatchSize)
      batches.push(batch)
   }

   const _status = (action === 'add' ? true : false)

   // Process whitelist in batch
   console.log('Sending addresses to ' + action + ' in ' + batches.length + ' batches.')
   for (var i = 0; i < batches.length; i++) {
      console.log('Processing batch ' + (i + 1) + ' of ' + batches.length)

      const batch = batches[i]

      const addresses = batch.map(element => element.address)

      // Just do a sanity check first to make sure everything is ok. It should return true.
      assert.equal(await sale.methods.updateWhitelistBatch(addresses, _status).call({ from: opsAddress }), true)

      // Send the transaction to the blockchain.
      const receipt = await sale.methods.updateWhitelistBatch(addresses, _status).send({ from: opsAddress })
      console.log(receipt)

      // Validate the receipt
      var events = receipt.events.WhitelistUpdated

      if (Array.isArray(events) === false) {
         events = [ events ]
      }

      assert.equal(events.length, batch.length)

      for (var j = 0; j < batch.length; j++) {
         const _address = batch[j].address

         assert.equal(events[j].returnValues._account, _address)

         // Verify the whitelisted state in the sale contract
         if (_status === true) {
            assert.equal(events[j].returnValues._status, _status)
            assert.equal(await sale.methods.whitelist(_address).call(), _status)
            console.log('[+] ' + _address)
         } else {
            const eventStatus = events[j].returnValues._status
            assert.isTrue(eventStatus === null || eventStatus === false, "Event status not as expected")

            const actualStatus = await sale.methods.whitelist(_address).call()
            assert.isTrue(actualStatus === null || actualStatus === false, "Whitelist status not as expected")
            console.log('[-] ' + _address)
         }
      }
   }
}


run()
