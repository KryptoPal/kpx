/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
pragma solidity ^0.4.24;


interface ERC20Token {
    function name() public constant returns (string); //solium-disable-line no-constant
    function symbol() public constant returns (string); //solium-disable-line no-constant
    function decimals() public constant returns (uint8); //solium-disable-line no-constant
    function totalSupply() public constant returns (uint256); //solium-disable-line no-constant
    function balanceOf(address owner) public constant returns (uint256); //solium-disable-line no-constant
    function transfer(address to, uint256 amount) public returns (bool);
    function transferFrom(address from, address to, uint256 amount) public returns (bool);
    function approve(address spender, uint256 amount) public returns (bool);
    function allowance(address owner, address spender) public constant returns (uint256); //solium-disable-line no-constant

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);
}