pragma solidity ^0.5.4;

import "./ERC165Interface.sol";

contract Upgradeable is ERC165Interface {
  bytes4 interfaceId;

  constructor (bytes4 _interfaceId) public {
    interfaceId = _interfaceId;
  }

  function upgrade(address payable _newContract) external {
    ERC165Interface i = ERC165Interface(_newContract);
    require(i.supportsInterface(interfaceId), 'new contract has different interface');
    selfdestruct(_newContract);
  }

  function supportsInterface(bytes4 _interfaceId) external view returns (bool) {
    return _interfaceId == interfaceId;
  }

  // NOTE: we don't need to explicitly specify a payable fallback function
  // since ETH received from a selfdestruct() is always accepted.
  //
  // (see https://solidity.readthedocs.io/en/v0.5.4/contracts.html#fallback-function)
}
