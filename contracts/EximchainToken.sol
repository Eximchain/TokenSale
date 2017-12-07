pragma solidity ^0.4.18;

// ----------------------------------------------------------------------------
// Eximchain Token Contract
//
// Copyright (c) 2017 Eximchain Pte. Ltd.
// http://www.eximchain.com/
//
// The MIT Licence.
// ----------------------------------------------------------------------------

import "./Enuma/FinalizableToken.sol";
import "./EximchainTokenConfig.sol";


// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
contract EximchainToken is FinalizableToken, EximchainTokenConfig {

   //
   // Events
   //
   event TokensBurnt(address indexed _account, uint256 _amount);


   function EximchainToken() public
      FinalizableToken(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS, TOKEN_TOTALSUPPLY)
   {
   }


   function burn(uint256 _amount) public returns (bool) {
      require(_amount > 0);

      address account = msg.sender;
      require(_amount <= balanceOf(account));

      balances[account] = balances[account].sub(_amount);
      tokenTotalSupply = tokenTotalSupply.sub(_amount);

      TokensBurnt(account, _amount);

      return true;
   }
}

