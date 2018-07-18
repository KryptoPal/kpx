pragma solidity 0.4.24;

import "./eip777/Basic777.sol";

contract KPX is Basic777 {
  constructor(
    string _name,
    string _symbol,
    uint256 _granularity
  ) public Basic777(
    _name,
    _symbol,
    _granularity
  ) {

  }

}