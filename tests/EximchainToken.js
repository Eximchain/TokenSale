// ----------------------------------------------------------------------------
// EximchainToken Contract Tests
//
// Copyright (c) 2017 Eximchain Pte. Ltd.
// http://www.eximchain.com/
// The MIT Licence.
//
// Based on FlexibleTokenSale tests from Enuma Technologies.
// Copyright (c) 2017 Enuma Technologies
// https://www.enuma.io/
// ----------------------------------------------------------------------------

const Utils = require('./lib/EximchainTestUtils.js')


// ----------------------------------------------------------------------------
// Tests Summary
// ----------------------------------------------------------------------------
// Construction and basic properties
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
//    - burn(balance)
//    - burn as ops
//    - burn as normal
// Events
//    TokensBurnt
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


//    - burn(0)
//    - burn(1)
//    - burn(> balance)
//    - burn(balance)
//    - burn as ops
//    - burn as normal
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

      it('burn(balance)', async () => {
         const ownerTokensBefore = new BigNumber(await token.methods.balanceOf(owner).call())

         assert.equal(await token.methods.burn(ownerTokensBefore).call({ from: owner }), true)
         Utils.checkBurn(await token.methods.burn(ownerTokensBefore).send({ from: owner }), owner, ownerTokensBefore.toNumber())

         const ownerTokensAfter  = new BigNumber(await token.methods.balanceOf(owner).call())

         assert.isTrue(ownerTokensAfter.sub(ownerTokensBefore).eq(ownerTokensBefore.mul(-1)), "Expected owner tokens to all be burnt")
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
})
