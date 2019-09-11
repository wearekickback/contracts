pragma solidity ^0.5.11;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol';
contract MyToken is ERC20, ERC20Detailed {
    string private _name = 'Dai Stablecoin v1.0';
    string private _symbol = 'DAI';
    uint8 private _decimals = 18;

    address account = msg.sender;
    uint value = 1000000 ether;

    constructor() ERC20Detailed( _name, _symbol, _decimals) public {
        _mint(account, value);
    }
}