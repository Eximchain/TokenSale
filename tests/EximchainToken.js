// ----------------------------------------------------------------------------
// EximchainToken Contract Tests
//
// Copyright (c) 2017 Eximchain Pte. Ltd.
// http://www.eximchain.com/
// The MIT Licence.
//
// Based on FinalizableToken tests from Enuma Technologies.
// Copyright (c) 2017 Enuma Technologies
// https://www.enuma.io/
// ----------------------------------------------------------------------------

const Utils = require('./lib/EximchainTestUtils.js')


// ----------------------------------------------------------------------------
// Tests Summary
// ----------------------------------------------------------------------------
// Construction and basic properties
//    - frozen
//    - name (inherited)
//    - symbol (inherited)
//    - decimals (inherited)
//    - totalSupply (inherited)
//    - owner (inherited)
//    - ops (inherited)
//    - balances should be private
//    - allowed should be private
// burn
//    - burn(0)
//    - burn(1)
//    - burn(> balance)
//    - burn(balance - 1000)
//    - burn as ops
//    - burn as normal
// reclaimTokens
//    - reclaimTokens when 0 to reclaim
//    - reclaimTokens when > 0 to reclaim
//    - reclaim tokens again
//    - reclaim tokens as normal
// freeze
//    - freeze as normal
//    - freeze as ops
//    - freeze before finalize
//    - freeze when already frozen
//    - freeze after finalize
// Events
//    TokensBurnt
//    TokensReclaimed
//       * Covered in the burn function tests.
//
describe('EximchainToken Contract', () => {

   var token = null
   var accounts = null

   const TOKEN_NAME        = "Eximchain Token"
   const TOKEN_SYMBOL      = "EXC"
   const TOKEN_DECIMALS    = 18
   const DECIMALS_FACTOR   = new BigNumber(10).pow(TOKEN_DECIMALS)
   const TOKEN_TOTALSUPPLY = new BigNumber("150000000").mul(DECIMALS_FACTOR)


   var deploymentResult = null

   // Accounts used for testing
   var owner = null
   var ops = null
   var account1 = null
   var account2 = null
   var account3 = null


   before(async () => {
      await TestLib.initialize()

      accounts = await web3.eth.getAccounts()

      owner         = accounts[1]
      ops           = accounts[2]
      account1      = accounts[3]
      account2      = accounts[4]
      account3      = accounts[5]

      deploymentResult = await TestLib.deploy('EximchainToken', [], { from: owner })

      token = deploymentResult.instance

      await token.methods.setOpsAddress(ops).send({ from: owner })
   })


   context('Construction and basic properties', async () => {

      it('name', async () => {
         assert.equal(await token.methods.name().call(), TOKEN_NAME)
      })

      it('symbol', async () => {
         assert.equal(await token.methods.symbol().call(), TOKEN_SYMBOL)
      })

      it('decimals', async () => {
         assert.equal(await token.methods.decimals().call(), TOKEN_DECIMALS)
      })

      it('totalSupply', async () => {
         assert.equal(new BigNumber(await token.methods.totalSupply().call()), TOKEN_TOTALSUPPLY)
      })

      it('owner', async () => {
         assert.equal(await token.methods.owner().call(), owner)
      })

      it('opsAddress', async () => {
         assert.equal(await token.methods.opsAddress().call(), ops)
      })

      it('balances should be private', async () => {
         assert.equal(typeof token.methods.balances, 'undefined')
      })

      it('allowed should be private', async () => {
         assert.equal(typeof token.methods.allowed, 'undefined')
      })
   })


   context('burn', async () => {

      before(async () => {
         await token.methods.transfer(ops, 500).send({ from: owner })
         await token.methods.transfer(account1, 1000).send({ from: owner })
      })


      it('burn(0)', async () => {
         await TestLib.assertCallFails(token.methods.burn(0).call({ from: owner }))
      })

      it('burn(1)', async () => {
         const ownerTokensBefore = new BigNumber(await token.methods.balanceOf(owner).call())

         assert.equal(await token.methods.burn(1).call({ from: owner }), true)
         Utils.checkBurn(await token.methods.burn(1).send({ from: owner }), owner, 1)

         const ownerTokensAfter  = new BigNumber(await token.methods.balanceOf(owner).call())

         assert.isTrue(ownerTokensAfter.sub(ownerTokensBefore).eq(-1), "Expected owner tokens to go down by 1")
      })

      it('burn(> balance)', async () => {
         const ownerTokensBefore = new BigNumber(await token.methods.balanceOf(owner).call())

         await TestLib.assertCallFails(token.methods.burn(ownerTokensBefore.add(1)).call({ from: owner }))
      })

      it('burn(balance - 1000)', async () => {
         var ownerTokensBefore = new BigNumber(await token.methods.balanceOf(owner).call()).sub(1000)
         assert.isTrue(ownerTokensBefore.gte(0))

         assert.equal(await token.methods.burn(ownerTokensBefore).call({ from: owner }), true)
         Utils.checkBurn(await token.methods.burn(ownerTokensBefore).send({ from: owner }), owner, ownerTokensBefore.toNumber())

         const ownerTokensAfter  = new BigNumber(await token.methods.balanceOf(owner).call())

         //assert.isTrue(ownerTokensAfter.sub(ownerTokensBefore).eq(ownerTokensBefore.mul(-1)), "Expected owner tokens to all be burnt")
         assert.equal(ownerTokensAfter.toString(), 1000)
      })

      it('burn as ops', async () => {
         const opsTokensBefore = new BigNumber(await token.methods.balanceOf(ops).call())

         assert.equal(await token.methods.burn(opsTokensBefore).call({ from: ops }), true)
         Utils.checkBurn(await token.methods.burn(opsTokensBefore).send({ from: ops }), ops, opsTokensBefore.toNumber())

         const opsTokensAfter  = new BigNumber(await token.methods.balanceOf(ops).call())

         assert.isTrue(opsTokensAfter.sub(opsTokensBefore).eq(opsTokensBefore.mul(-1)), "Expected ops tokens to all be burnt")
      })

      it('burn as normal', async () => {
         const tokensBefore = new BigNumber(await token.methods.balanceOf(account1).call())

         assert.equal(await token.methods.burn(tokensBefore).call({ from: account1 }), true)
         Utils.checkBurn(await token.methods.burn(tokensBefore).send({ from: account1 }), account1, tokensBefore.toNumber())

         const tokensAfter  = new BigNumber(await token.methods.balanceOf(account1).call())

         assert.isTrue(tokensAfter.sub(tokensBefore).eq(tokensBefore.mul(-1)), "Expected account1 tokens to all be burnt")
      })
   })


   context('freeze', async () => {

      before(async () => {
      })


      it('freeze as normal', async () => {
         await TestLib.assertCallFails(token.methods.freeze().call({ from: account1 }))
      })

      it('freeze as ops', async () => {
         await TestLib.assertCallFails(token.methods.freeze().call({ from: ops }))
      })

      it('freeze before finalize', async () => {
         assert.equal(await token.methods.finalized().call(), false)
         assert.equal(await token.methods.frozen().call(), false)

         await token.methods.transfer(account1, 1).call({ from: owner })

         await TestLib.assertCallFails(token.methods.transfer(account1, 2).call({ from: account1 }))

         assert.equal(await token.methods.freeze().call({ from: owner }), true)
         Utils.checkFreeze(await token.methods.freeze().send({ from: owner }))

         await TestLib.assertCallFails(token.methods.transfer(account1, 1).call({ from: owner }))
      })

      it('freeze when already frozen', async () => {
         assert.equal(await token.methods.frozen().call(), true)

         await TestLib.assertCallFails(token.methods.freeze().call({ from: owner }))
      })

      it('freeze after finalize', async () => {
         deploymentResult = await TestLib.deploy('EximchainToken', [], { from: owner })
         token = deploymentResult.instance
         await token.methods.transfer(account1, 10).send({ from: owner })
         await token.methods.finalize().send({ from: owner })
         assert.equal(await token.methods.finalized().call(), true)
         assert.equal(await token.methods.frozen().call(), false)

         assert.equal(await token.methods.transfer(account2, 1).call({ from: account1 }), true)
         assert.equal(await token.methods.transfer(account1, 1).call({ from: owner }), true)

         assert.equal(await token.methods.freeze().call({ from: owner }), true)
         Utils.checkFreeze(await token.methods.freeze().send({ from: owner }))
         assert.equal(await token.methods.frozen().call(), true)

         await TestLib.assertCallFails(token.methods.transfer(account2, 1).call({ from: account1 }))
         await TestLib.assertCallFails(token.methods.transfer(account1, 1).call({ from: owner }))
      })
   })


   context('reclaimTokens', async () => {

      before(async () => {
         deploymentResult = await TestLib.deploy('EximchainToken', [], { from: owner })

         token = deploymentResult.instance

         await token.methods.setOpsAddress(ops).send({ from: owner })
      })


      it('reclaimTokens when 0 to reclaim', async () => {
         assert.equal(await token.methods.balanceOf(token._address).call(), 0)

         assert.equal(await token.methods.reclaimTokens().call({ from: owner }), false)
      })

      it('reclaimTokens when > 0 to reclaim', async () => {
         await token.methods.transfer(token._address, 1000).send({ from: owner })
         assert.equal(await token.methods.balanceOf(token._address).call(), 1000)

         const ownerBalanceBefore = new BigNumber(await token.methods.balanceOf(owner).call())

         assert.equal(await token.methods.reclaimTokens().call({ from: owner }), true)
         Utils.checkReclaimTokens(await token.methods.reclaimTokens().send({ from: owner }), token._address, owner, 1000)

         assert.equal(await token.methods.balanceOf(token._address).call(), 0)
         assert.equal(ownerBalanceBefore.sub(await token.methods.balanceOf(owner).call()).toString(), -1000)
      })

      it('reclaimTokens again', async () => {
         assert.equal(await token.methods.balanceOf(token._address).call(), 0)

         assert.equal(await token.methods.reclaimTokens().call({ from: owner }), false)
      })

      it('reclaimTokens as normal', async () => {
         await TestLib.assertCallFails(token.methods.reclaimTokens().send({ from: account1 }))
      })
   })
})
