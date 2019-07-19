import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol';
contract MyToken is ERC20, ERC20Detailed {

    string private _name = "Matoken";
    string private _symbol = "MTK";
    uint8 private _decimals = 18;

    address account = msg.sender;
    uint value = 100000000000000000000;

    constructor() ERC20Detailed( _name, _symbol, _decimals) public {
        _mint(account, value);
    }
}