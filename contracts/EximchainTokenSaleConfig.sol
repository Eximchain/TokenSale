pragma solidity ^0.4.18;

// ----------------------------------------------------------------------------
// Eximchain Token Sale Contract Configuration
//
// Copyright (c) 2017 Eximchain Pte. Ltd.
// http://www.eximchain.com/
//
// The MIT Licence.
// ----------------------------------------------------------------------------

import "./EximchainTokenConfig.sol";


contract EximchainTokenSaleConfig is EximchainTokenConfig {

    //
    // Time
    //
    uint256 public constant START_TIME = 1516579200; // 2018-01-22, 00:00:00 UTC
    uint256 public constant END_TIME   = 1518825600; // 2018-02-17, 00:00:00 UTC


    //
    // Purchases
    //

    // Minimum amount of ETH that can be used for purchase.
    uint256 public constant CONTRIBUTION_MIN      = 0.1 ether;

    //
    uint256 public constant TOKENS_PER_KETHER     = 10000;

    //
    uint256 public constant BONUS                 = 0;

    //
    uint256 public constant TOKENS_ACCOUNT_MAX    = 0 * DECIMALSFACTOR;
}

