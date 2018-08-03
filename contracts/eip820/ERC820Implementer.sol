pragma solidity ^0.4.24;

contract ERC820Registry {
  function getManager(address addr) public view returns(address);
  function setManager(address addr, address newManager) public;
  function getInterfaceImplementer(address addr, bytes32 iHash) public view returns (address);
  function setInterfaceImplementer(address addr, bytes32 iHash, address implementer) public;
}

contract ERC820Implementer {
  ERC820Registry internal erc820Registry = ERC820Registry(0x991a1bcb077599290d7305493c9A630c20f8b798);
  //ERC820Implementer public erc820Registry;
  function setIntrospectionRegistry(address _erc820Registry) internal {
    erc820Registry = ERC820Registry(_erc820Registry);
  }

  function getIntrospectionRegistry() public view returns(address) {
    return erc820Registry;
  }

  function setInterfaceImplementation(string ifaceLabel, address impl) internal {
    bytes32 ifaceHash = keccak256(abi.encodePacked(ifaceLabel));
    erc820Registry.setInterfaceImplementer(this, ifaceHash, impl);
  }

  function interfaceAddr(address addr, string ifaceLabel) internal view returns(address) {
    bytes32 ifaceHash = keccak256(abi.encodePacked(ifaceLabel));
    return erc820Registry.getInterfaceImplementer(addr, ifaceHash);
  }

  function delegateManagement(address newManager) internal {
    erc820Registry.setManager(this, newManager);
  }
}
