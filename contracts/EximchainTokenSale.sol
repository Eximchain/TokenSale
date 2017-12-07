pragma solidity ^0.4.18;

// ----------------------------------------------------------------------------
// Eximchain Token Sale Contract
//
// Copyright (c) 2017 Eximchain Pte. Ltd.
// http://www.eximchain.com/
//
// The MIT Licence.
// ----------------------------------------------------------------------------

import "./Enuma/FlexibleTokenSale.sol";
import "./EximchainTokenSaleConfig.sol";


contract EximchainTokenSale is FlexibleTokenSale, EximchainTokenSaleConfig {

   //
   // Fields
   //
   mapping(address => bool) public whitelist;


   //
   // Events
   //
   event WhitelistUpdated(address indexed _account, bool _status);


   function EximchainTokenSale(address wallet) public
      FlexibleTokenSale(START_TIME, END_TIME, wallet)
   {
      tokensPerKEther     = TOKENS_PER_KETHER;
      bonus               = BONUS;
      maxTokensPerAccount = TOKENS_ACCOUNT_MAX;
      contributionMin     = CONTRIBUTION_MIN;
   }


   function updateWhitelist(address _account, bool _status) public onlyOwnerOrOps returns (bool) {
      return updateWhitelistInternal(_account, _status);
   }


   function updateWhitelistInternal(address _account, bool _status) private returns (bool) {
      require(_account != address(0));
      require(_account != address(this));
      require(_account != address(walletAddress));
      require(_account != address(token));

      if (whitelist[_account] == _status) {
         return true;
      }

      whitelist[_account] = _status;

      WhitelistUpdated(_account, _status);

      return true;
   }


   function updateWhitelistBatch(address[] _accounts, bool _status) external onlyOwnerOrOps returns (bool) {
      require(_accounts.length > 0);

      for (uint256 i = 0; i < _accounts.length; i++) {
         require(updateWhitelistInternal(_accounts[i], _status));
      }

      return true;
   }


   function buyTokens(address _beneficiary) public payable returns (uint256) {
      require(whitelist[msg.sender] == true);
      require(whitelist[_beneficiary] == true);

      return super.buyTokensInternal(_beneficiary, bonus);
   }
}

