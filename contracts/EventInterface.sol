pragma solidity ^0.5.4;

interface EventInterface {
  function hasEnded() external view returns (bool);
  function getPayout(address _addr) external view returns (uint256);
  function getDeposit(address _addr) external view returns (uint256);
}
