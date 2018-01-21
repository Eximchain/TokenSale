pragma solidity ^0.4.18;

// ----------------------------------------------------------------------------
// Eximchain Token Contract
//
// Copyright (c) 2017 Eximchain Pte. Ltd.
// http://www.eximchain.com/
// The MIT Licence.
//
// Based on FinalizableToken contract from Enuma Technologies.
// Copyright (c) 2017 Enuma Technologies
// https://www.enuma.io/
// ----------------------------------------------------------------------------

import "./Enuma/FinalizableToken.sol";
import "./EximchainTokenConfig.sol";


contract EximchainToken is FinalizableToken, EximchainTokenConfig {


   bool public frozen;


   //
   // Events
   //
   event TokensBurnt(address indexed _account, uint256 _amount);
   event TokensReclaimed(uint256 _amount);
   event Frozen();


   function EximchainToken() public
      FinalizableToken(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS, TOKEN_TOTALSUPPLY)
   {
      frozen = false;
   }


   function transfer(address _to, uint256 _value) public returns (bool success) {
      require(!frozen);

      return super.transfer(_to, _value);
   }


   function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
      require(!frozen);

      return super.transferFrom(_from, _to, _value);
   }


   // Allows a token holder to burn tokens. Once burned, tokens are permanently
   // removed from the total supply.
   function burn(uint256 _amount) public returns (bool) {
      require(_amount > 0);

      address account = msg.sender;
      require(_amount <= balanceOf(account));

      balances[account] = balances[account].sub(_amount);
      tokenTotalSupply = tokenTotalSupply.sub(_amount);

      TokensBurnt(account, _amount);

      return true;
   }


   // Allows the owner to reclaim tokens that are assigned to the token contract itself.
   function reclaimTokens() public onlyOwner returns (bool) {

      address account = address(this);
      uint256 amount  = balanceOf(account);

      if (amount == 0) {
         return false;
      }

      balances[account] = balances[account].sub(amount);
      balances[owner] = balances[owner].add(amount);

      Transfer(account, owner, amount);

      TokensReclaimed(amount);

      return true;
   }


   // Allows the owner to permanently disable token transfers. This can be used
   // once side chain is ready and the owner wants to stop transfers to take a snapshot
   // of token balances for the genesis of the side chain.
   function freeze() public onlyOwner returns (bool) {
      require(!frozen);

      frozen = true;

      Frozen();

      return true;
   }
}

