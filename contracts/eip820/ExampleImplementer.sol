pragma solidity ^0.4.24;

import "./ERC820ImplementerInterface.sol";


contract ExampleImplementer is ERC820ImplementerInterface {
  /// addr, interfaceHash as params
  function canImplementInterfaceForAddress(address, bytes32) view public returns(bytes32) {
    return ERC820_ACCEPT_MAGIC;
  }
}
