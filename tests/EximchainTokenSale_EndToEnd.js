// ----------------------------------------------------------------------------
// Eximchain End-To-End Scenario Test
//
// Copyright (c) 2017 Eximchain Pte. Ltd.
// http://www.eximchain.com/
// The MIT Licence.
//
// Based on FlexibleTokenSale end-to-end tests from Enuma Technologies.
// Copyright (c) 2017 Enuma Technologies
// https://www.enuma.io/
// ----------------------------------------------------------------------------

const StdUtils = require('./Enuma/lib/StdTestUtils.js')
const Utils    = require('./lib/EximchainTestUtils.js')


// ----------------------------------------------------------------------------
// Tests Summary
// ----------------------------------------------------------------------------
// - Initial Deployment
//    - Deploy the token contract
//    - Deploy the sale contract
//    - Initialize the sale contract
//    - Set the ops key of token to the sale contract
//    - Set the ops key of sale to a ops key
// - Private Sale
//    + Record private sales
// - Before Public Sale
//    - Set time window for the public sale
//    - Set a new bonus amount
//    - Update whitelist with applicants
//    - Set the per account contribution limit
//    - Assign tokens for sale
// - During Public Sale
//    - Contributor buys max allowed tokens
//    - Raise per account contribution limit
//    - Contributor buys max allowed tokens (again)
//    - Remove the account contribution limit
//    - Contributor buys more tokens
// - After Public Sale
//    - Reclaim tokens (should be 0)
//    - Burn tokens
//    - Finalize the token
//    - Finalize the sale
//
describe('Eximchain End-To-End Scenario', () => {

   const TOKEN_NAME            = "Eximchain Token"
   const TOKEN_SYMBOL          = "EXC"
   const TOKEN_DECIMALS        = 18
   const DECIMALS_FACTOR       = new BigNumber(10).pow(TOKEN_DECIMALS)
   const TOKEN_TOTALSUPPLY     = new BigNumber("150000000").mul(DECIMALS_FACTOR)

   const CONTRIBUTION_MIN      = new BigNumber(0.1).mul(DECIMALS_FACTOR)


   // Public sale configuration
   const PUBLICSALE_TOKENS              = new BigNumber("150000000").mul(DECIMALS_FACTOR)
   const PUBLICSALE_TOKENSPERKETHER     = 100000
   const PUBLICSALE_BONUS               = 0
   const PUBLICSALE_MAXTOKENSPERACCOUNT = new BigNumber(1000).mul(DECIMALS_FACTOR)
   const PUBLICSALE_STARTTIME           = Moment.unix(1516579200)
   const PUBLICSALE_ENDTIME             = Moment.unix(1518825600)


   var sale = null
   var token = null
   var accounts = null

   // Accounts used for testing
   var owner    = null
   var ops      = null
   var wallet   = null
   var account1 = null
   var account2 = null
   var account3 = null
   var account4 = null
   var account5 = null
   var account6 = null
   var account7 = null


   const buyTokens = async (from, to, amount) => {
      return StdUtils.buyTokens(
         token,
         sale,
         owner,
         wallet,
         DECIMALS_FACTOR,
         from,
         to,
         amount
      )
   }


   before(async () => {
      await TestLib.initialize()

      accounts = await web3.eth.getAccounts()

      owner    = accounts[1]
      ops      = accounts[2]
      wallet   = accounts[3]
      account1 = accounts[4]
      account2 = accounts[5]
      account3 = accounts[6]
      account4 = accounts[7]
      account5 = accounts[8]
      account6 = accounts[9]
      account7 = accounts[10]

      var deploymentResult = null
   })


   context('Initial deployment', async () => {

      it('Deploy the token contract', async () => {
         deploymentResult = await TestLib.deploy('EximchainToken', [ ], { from: owner })
         token = deploymentResult.instance

         assert.equal(new BigNumber(await token.methods.balanceOf(owner).call()), TOKEN_TOTALSUPPLY)
      })

      it('Deploy the sale contract', async () => {
         deploymentResult = await TestLib.deploy('EximchainTokenSaleMock', [ wallet, Moment().unix() ], { from: owner })
         sale = deploymentResult.instance

         assert.equal(await sale.methods.owner().call(), owner)
      })

      it('Initialize the sale contract', async () => {
         await sale.methods.initialize(token._address).send({ from: owner })
         assert.equal(await sale.methods.token().call(), token._address)
         assert.equal(new BigNumber(await sale.methods.tokenConversionFactor().call()), new BigNumber(10).pow(18 - TOKEN_DECIMALS + 3 + 4))
      })

      it('Set the ops key of the token to the sale contract', async () => {
         await token.methods.setOpsAddress(sale._address).send({ from: owner })
         assert.equal(await token.methods.opsAddress().call(), sale._address)
      })

      it('Set the ops key of the sale to a ops key', async () => {
         await sale.methods.setOpsAddress(ops).send({ from: owner })
         assert.equal(await sale.methods.opsAddress().call(), ops)
      })
   })

/*
   context('Private Sale', async () => {

      before(async () => {
         await sale.methods.changeTime(PRESALE_STARTTIME.unix() + 1).send({ from: owner })
      })


   })
*/

   context('Before Public Sale', async () => {

      it('Set time window for the public sale', async () => {
         await sale.methods.setSaleWindow(PUBLICSALE_STARTTIME.unix(), PUBLICSALE_ENDTIME.unix()).send({ from: owner })
         assert.equal(await sale.methods.startTime().call(), PUBLICSALE_STARTTIME.unix())
         assert.equal(await sale.methods.endTime().call(), PUBLICSALE_ENDTIME.unix())
      })

      it('Set a bonus amount', async () => {
         await sale.methods.setBonus(PUBLICSALE_BONUS).send({ from: owner })
         assert.equal(await sale.methods.bonus().call(), PUBLICSALE_BONUS)
      })

      it('Update whitelist with applicants', async () => {
         var addresses = [ account7 ]

         assert.equal(await sale.methods.updateWhitelistBatch(addresses, true).call({ from: ops }), true)
         receipt = await sale.methods.updateWhitelistBatch(addresses, true).send({ from: ops })

         for (i = 0; i < addresses.length; i++) {
            assert.equal(await sale.methods.whitelist(addresses[i]).call(), true)
         }
      })

      it('Set per account contribution limit', async () => {
         await sale.methods.setMaxTokensPerAccount(PUBLICSALE_MAXTOKENSPERACCOUNT).send({ from: owner })
         assert.equal(new BigNumber(await sale.methods.maxTokensPerAccount().call()), PUBLICSALE_MAXTOKENSPERACCOUNT)
      })

      it('Set the token price', async () => {
         await sale.methods.setTokensPerKEther(PUBLICSALE_TOKENSPERKETHER).send({ from: owner })
         assert.equal(await sale.methods.tokensPerKEther().call(), PUBLICSALE_TOKENSPERKETHER)
      })

      it('Give tokens to the sale contract', async () => {
         await token.methods.transfer(sale._address, PUBLICSALE_TOKENS).send({ from: owner })
         assert.equal(new BigNumber(await token.methods.balanceOf(sale._address).call()), PUBLICSALE_TOKENS)
      })
   })


   context('During Public Sale', async () => {

      var tokenSoldPresale = null


      before(async () => {
         await sale.methods.changeTime(PUBLICSALE_STARTTIME.unix() + 1).send({ from: owner })

         tokensSoldPresale = new BigNumber(await sale.methods.totalTokensSold().call())
      })


      it('Contributor buys max allowed tokens', async () => {
         await buyTokens(account7, account7, -1)
      })

      it('Raise per account contribution limit', async () => {
         await sale.methods.setMaxTokensPerAccount(PUBLICSALE_MAXTOKENSPERACCOUNT.mul(2)).send({ from: owner })
      })

      it('Contributor buys max allowed tokens (again)', async () => {
         await buyTokens(account7, account7, -1)
      })

      it('Remove per account contribution limit', async () => {
         await sale.methods.setMaxTokensPerAccount(0).send({ from: owner })
      })

      it('Contributor buys more tokens', async () => {
         await buyTokens(account7, account7, CONTRIBUTION_MIN)
      })
   })


   context('After Public Sale', async () => {

      it('Reclaim unsold tokens', async () => {
         const ownerTokensBefore = new BigNumber(await token.methods.balanceOf(owner).call())
         const saleTokensBefore = new BigNumber(await token.methods.balanceOf(sale._address).call())

         await sale.methods.reclaimTokens().send({ from: owner })

         const ownerTokensAfter = new BigNumber(await token.methods.balanceOf(owner).call())
         const saleTokensAfter = new BigNumber(await token.methods.balanceOf(sale._address).call())

         assert.isTrue(saleTokensBefore.gt(0))
         assert.equal(saleTokensAfter, new BigNumber(0))

         assert.equal(ownerTokensAfter.sub(ownerTokensBefore), saleTokensBefore)
      })

      it('Burn unsold tokens', async () => {
         const ownerTokensBefore = new BigNumber(await token.methods.balanceOf(owner).call())
         const saleTokensBefore = new BigNumber(await token.methods.balanceOf(sale._address).call())

         await token.methods.burn(ownerTokensBefore).send({ from: owner })

         const ownerTokensAfter = new BigNumber(await token.methods.balanceOf(owner).call())
         const saleTokensAfter = new BigNumber(await token.methods.balanceOf(sale._address).call())

         assert.equal(saleTokensBefore, new BigNumber(0))
         assert.equal(saleTokensAfter, new BigNumber(0))

         assert.isTrue(ownerTokensBefore.gt(0), "Expected owner tokens before to be > 0")
         assert.isTrue(ownerTokensAfter.eq(0), "Expected owner tokens after to be = 0")
      })

      it('Finalize the token', async () => {
         assert.equal(await token.methods.finalized().call(), false)
         await token.methods.finalize().send({ from: owner })
         assert.equal(await token.methods.finalized().call(), true)
      })

      it('Finalize the sale', async () => {
         // IMPORTANT: Finalizing the sale contract means that it can never be used for later sales. Another
         //            sale contract would need to be deployed. If the contract should be used to more sales
         //            in the future, consider calling 'suspend' instead.
         assert.equal(await sale.methods.finalized().call(), false)
         await sale.methods.finalize().send({ from: owner })
         assert.equal(await sale.methods.finalized().call(), true)
      })
   })
})
