pragma solidity ^0.4.24;

import "./ERC820Implementer.sol";

contract ExampleImplementer2 is ERC820Implementer {

  constructor() public {
    setInterfaceImplementation("ERC820ExampleImplementer2", this);
  }

}
