pragma solidity ^0.5.4;

interface StorageInterface {
  function getAddress(address _addr, bytes32 _key) external view returns (address);
  function setAddress(address _addr, bytes32 _key, address _value) external;

  function getString(address _addr, bytes32 _key) external view returns (string memory);
  function setString(address _addr, bytes32 _key, string calldata _value) external;

  function getBytes32(address _addr, bytes32 _key) external view returns (bytes32);
  function setBytes32(address _addr, bytes32 _key, bytes32 _value) external;

  function getUint(address _addr, bytes32 _key) external view returns (uint256);
  function setUint(address _addr, bytes32 _key, uint256 _value) external;

  function getBool(address _addr, bytes32 _key) external view returns (bool);
  function setBool(address _addr, bytes32 _key, bool _value) external;

  function getAddressList(address _addr, bytes32 _key) external view returns (address[] memory);
  function setAddressList(address _addr, bytes32 _key, address[] calldata _value, uint256 _len) external;

  function getBytes32List(address _addr, bytes32 _key) external view returns (bytes32[] memory);
  function setBytes32List(address _addr, bytes32 _key, bytes32[] calldata _value, uint256 _len) external;

  function getUintList(address _addr, bytes32 _key) external view returns (uint256[] memory);
  function setUintList(address _addr, bytes32 _key, uint256[] calldata _value, uint256 _len) external;

  function getBoolList(address _addr, bytes32 _key) external view returns (bool[] memory);
  function setBoolList(address _addr, bytes32 _key, bool[] calldata _value, uint256 _len) external;
}
