// SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    string private _name = 'Dai Stablecoin v1.0';
    string private _symbol = 'DAI';

    address account = msg.sender;
    uint value = 1000000 ether;

    constructor() ERC20( _name, _symbol) public {
        _mint(account, value);
    }
}