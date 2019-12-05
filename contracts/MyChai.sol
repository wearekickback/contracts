pragma solidity ^0.5.11;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol';
contract MyChai is ERC20, ERC20Detailed {
    string private _name = 'Chai';
    string private _symbol = 'CHAI';
    uint8 private _decimals = 18;
    address public daiToken;

    address account = msg.sender;
    uint value = 1000000 ether;

    uint rate = 1.02 ether;
    uint ONE = 1 ether;

    function sub(uint x, uint y) internal pure returns (uint z) {
        require((z = x - y) <= x);
    }

    constructor(address _daiToken) ERC20Detailed( _name, _symbol, _decimals) public {
        _mint(account, value);
        daiToken = _daiToken;
    }

    function join(address dst, uint256 wad) public {
        daiToken.transferFrom(msg.sender, address(this), wad);
        balanceOf[msg.sender] += wad;
    }

    function draw(address src, uint256 wad) public {
        balanceOf[msg.sender] = sub(balanceOf[msg.sender], (wad * ONE) / rate);
        daiToken.mint(address(this), (wad * (rate - 1 ether)) / ONE);
        daiToken.transfer(msg.sender, wad);
    }

    function dai(address usr) public {
        return rate * balanceOf[usr];
    }
}
