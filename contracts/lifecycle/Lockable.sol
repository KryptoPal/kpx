/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
pragma solidity ^0.4.24;


interface Lockable {
    function lockAndDistributeTokens(
      address _tokenHolder, 
      uint256 _amount, 
      uint256 _percentageToLock, 
      uint256 _unlockTime
    ) public;
    function getAmountOfUnlockedTokens(address tokenOwner) public returns(uint);

    event LockedTokens(address indexed tokenHolder, uint256 amountToLock, uint256 unlockTime);
}