// ----------------------------------------------------------------------------
// Eximchain Contracts Deployment Script
//
// Copyright (c) 2017 Eximchain Pte. Ltd.
// http://www.eximchain.com/
// The MIT Licence.
//
// Based on deployment scripts from Enuma Technologies.
// Copyright (c) 2017 Enuma Technologies
// https://www.enuma.io/
// ----------------------------------------------------------------------------

const fs           = require('fs')
const Web3         = require('web3')
const BigNumber    = require('bignumber.js')
const Moment       = require('moment')
const Chai         = require('chai')
assert             = Chai.assert

const Utils        = require('./utils.js')


// ----------------------------------------------------------------------------
// Script Summary
// ----------------------------------------------------------------------------


const TOKEN_NAME            = "Eximchain Token"
const TOKEN_SYMBOL          = "EXC"
const TOKEN_DECIMALS        = 18
const DECIMALS_FACTOR       = new BigNumber(10).pow(TOKEN_DECIMALS)
const TOKEN_TOTALSUPPLY     = new BigNumber("150000000").mul(DECIMALS_FACTOR)
const CONTRIBUTION_MIN      = new BigNumber(0.1).mul(DECIMALS_FACTOR)


// Initial Sale Configuration
const START_TIME             = 1516579200 // 2018-01-22, 00:00:00 UTC
const END_TIME               = 1518825600 // 2018-02-17, 00:00:00 UTC
const SALE_TOKENS            = 0
const TOKENSPERKETHER        = new BigNumber("10000")
const BONUS                  = new BigNumber("0")
const MAXTOKENSPERACCOUNT    = new BigNumber("0").mul(DECIMALS_FACTOR)


var sale = null
var token = null
var accounts = null

// Accounts used for testing
var owner    = null
var ops      = null
var wallet   = null

var receipts = []


function recordTransaction(description, receipt, display) {
   if (display) {
      console.log("TxID     : " + receipt.transactionHash)
      console.log("Gas used : " + receipt.gasUsed)
   }

   receipts.push([ description, receipt ])
}


async function run() {

   const config = JSON.parse(fs.readFileSync('../config.json'))

   const web3 = await Utils.buildWeb3(config.web3Url)

   accounts = await web3.eth.getAccounts()

   owner    = accounts[1]
   ops      = accounts[2]
   wallet   = accounts[3]

   var o = null
   var receipt = null
   var returnValues = null
   var deploymentResult = null


   console.log('')
   console.log('----------------------------------------------------------------------------------')

   //
   // Verify that all addresses are checksumed
   //
   assert.equal(web3.utils.checkAddressChecksum(owner), true)
   assert.equal(web3.utils.checkAddressChecksum(ops), true)
   assert.equal(web3.utils.checkAddressChecksum(wallet), true)

   //
   //
   // Deploy Token Contract
   //
   deploymentResult = await Utils.deployContract(web3, 'EximchainToken', [ ], { from: owner })
   recordTransaction('EximchainToken.new', deploymentResult.receipt, false)
   token = deploymentResult.instance
   receipt = deploymentResult.receipt

   assert.equal(Object.keys(receipt.events).length, 1)
   returnValues = receipt.events.Transfer.returnValues
   assert.equal(Object.keys(returnValues).length, 6)
   assert.equal(returnValues._from, 0)
   assert.equal(returnValues._to, owner)
   assert.equal(returnValues._value, TOKEN_TOTALSUPPLY.toNumber())

   // Check that the owner token balance is as expected
   assert.isTrue(new BigNumber(await token.methods.balanceOf(owner).call()).eq(TOKEN_TOTALSUPPLY))
   console.log('')

   //
   // Deploy Token Sale Contract
   //
   //deploymentResult = await Utils.deployContract(web3, 'EximchainTokenSaleMock', [ wallet, Moment().unix() ], { from: owner })
   deploymentResult = await Utils.deployContract(web3, 'EximchainTokenSale', [ wallet ], { from: owner })
   recordTransaction('EximchainTokenSale.new', deploymentResult.receipt)
   sale = deploymentResult.instance
   assert.equal(await sale.methods.owner().call(), owner)
   assert.equal(await sale.methods.bonus().call(), BONUS.toNumber())
   assert.equal(await sale.methods.tokensPerKEther().call(), TOKENSPERKETHER.toNumber())
   assert.equal(await sale.methods.maxTokensPerAccount().call(), MAXTOKENSPERACCOUNT.toNumber())
   assert.equal(await sale.methods.startTime().call(), START_TIME)
   assert.equal(await sale.methods.endTime().call(), END_TIME)
   console.log('')

   //
   // Initialize the sale contract
   //
   console.log('Initializing the sale contract')
   o = await sale.methods.initialize(token._address).send({ from: owner })
   recordTransaction('EximchainTokenSale.initialize', o, true)
   assert.equal(await sale.methods.token().call(), token._address)

   const factor = new BigNumber(await sale.methods.tokenConversionFactor().call())
   const expectedFactor = new BigNumber(10).pow(18 - TOKEN_DECIMALS + 3 + 4)
   assert.equal(factor.toNumber(), expectedFactor.toNumber())

   assert.equal(Object.keys(o.events).length, 1)
   assert.equal(typeof o.events.Initialized, 'object')
   console.log('')

   //
   // Set the ops keys
   //
   console.log('Setting the ops key of the token to the sale contract')
   o = await token.methods.setOpsAddress(sale._address).send({ from: owner })
   recordTransaction('EximchainToken.setOpsAddress', o, true)
   assert.equal(await token.methods.opsAddress().call(), sale._address)
   console.log('')

   console.log('Setting the ops key of the sale contract to ' + ops)
   o = await sale.methods.setOpsAddress(ops).send({ from: owner })
   recordTransaction('EximchainTokenSale.setOpsAddress', o, true)
   assert.equal(await sale.methods.opsAddress().call(), ops)
   console.log('')

   //
   // Gas Statistics
   //
   console.log('----------------------------------------------------------------------------------')
   console.log('Gas usage summary')
   console.log('----------------------------------------------------------------------------------')
   var totalGas = 0
   for (i = 0; i < receipts.length; i++) {
      console.log(receipts[i][0].padEnd(33) + receipts[i][1].gasUsed)
      totalGas += receipts[i][1].gasUsed
   }
   console.log('----------------------------------------------------------------------------------')
   console.log('Total gas recorded '.padEnd(33) + totalGas)

   console.log('')
   console.log('Deployment completed successfully.')
   console.log('')
}


run().catch(error => {
   console.log(error)
})
