pragma solidity ^0.4.18;

// ----------------------------------------------------------------------------
// Eximchain Token Sale Mock Contract (For Testing Only)
//
// Copyright (c) 2017 Eximchain Pte. Ltd.
// http://www.eximchain.com/
//
// The MIT Licence.
// ----------------------------------------------------------------------------

import "./EximchainTokenSale.sol";


contract EximchainTokenSaleMock is EximchainTokenSale {

   uint256 public _now;


   function EximchainTokenSaleMock(address wallet, uint256 _currentTime) public
      EximchainTokenSale(wallet)
   {
      _now = _currentTime;
   }


   function currentTime() public view returns (uint256) {
      return _now;
   }


   function changeTime(uint256 _newTime) public onlyOwner returns (bool) {
      _now = _newTime;

      return true;
   }
}


