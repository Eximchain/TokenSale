pragma solidity ^0.4.18;

// ----------------------------------------------------------------------------
// Eximchain Token Contract Configuration
//
// Copyright (c) 2017 Eximchain Pte. Ltd.
// http://www.eximchain.com/
//
// The MIT Licence.
// ----------------------------------------------------------------------------


contract EximchainTokenConfig {

    string  public constant TOKEN_SYMBOL      = "EXC";
    string  public constant TOKEN_NAME        = "Eximchain Token";
    uint8   public constant TOKEN_DECIMALS    = 18;

    uint256 public constant DECIMALSFACTOR    = 10**uint256(TOKEN_DECIMALS);
    uint256 public constant TOKEN_TOTALSUPPLY = 150000000 * DECIMALSFACTOR;
}

