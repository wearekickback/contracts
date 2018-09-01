pragma solidity ^0.4.24;

import "./zeppelin/ownership/Ownable.sol";

/**
 * The permanent on-chain contract which manages our other deployed contracts.
 */
contract Manager is Ownable {
  /**
   * All relevant contracts
   */
  mapping (bytes32 => address) public contracts;

  /**
   * Notify that a contract has changed.
   */
  event ContractChanged(
    bytes32 indexed key,
    address indexed oldContract,
    address indexed newContract
  );

  /**
   * Change the deployer contract address.
   * @param _key key identifying the contract
   * @param _address address of contract.
   */
  function setContract(bytes32 _key, address _address) external onlyOwner {
    emit ContractChanged(_key, contracts[_key], _address);
    contracts[_key] = _address;
  }

  /**
   * Don't allow arbitrary calls
   */
  function() public {
    revert();
  }
}
