/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
pragma solidity 0.4.24;

import "../eip820/ERC820Implementer.sol";
import "../eip820/ERC820ImplementerInterface.sol";
import "../lifecycle/Pausable.sol";
import "../eip777/ERC777TokensRecipient.sol";


contract ExampleTokensRecipient is ERC820Implementer, ERC820ImplementerInterface, ERC777TokensRecipient, Pausable {

  bool private allowTokensReceived;
  bool public notified;
  
  constructor(bool _setInterface, address _eip820RegistryAddr) public {
    setIntrospectionRegistry(_eip820RegistryAddr);
    if (_setInterface) { 
      setInterfaceImplementation("ERC777TokensRecipient", this); 
    }
    allowTokensReceived = true;
    notified = false;
  }
  
  function tokensReceived(
    address, // operator
    address, // from,
    address, // to,
    uint, // amount,
    bytes, // userData,
    bytes // operatorData
  ) public {
    require(allowTokensReceived);
    notified = true;
  }
  
  function acceptTokens() public onlyOwner { allowTokensReceived = true; }
  
  function rejectTokens() public onlyOwner { allowTokensReceived = false; }
  
  function canImplementInterfaceForAddress(address, bytes32) public view returns(bytes32) {
    return ERC820_ACCEPT_MAGIC;
  }
}