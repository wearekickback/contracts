pragma solidity ^0.5.4;

interface StorageInterface {
  function getAddress(address _addr, bytes32 _key) external view returns (address);
  function setAddress(address _addr, bytes32 _key, address _value) external;

  function getString(address _addr, bytes32 _key) external view returns (string);
  function setString(address _addr, bytes32 _key, string _value) external;

  function getBytes32(address _addr, bytes32 _key) external view returns (bytes32);
  function setBytes32(address _addr, bytes32 _key, bytes32 _value) external;

  function getUint(address _addr, bytes32 _key) external view returns (uint);
  function setUint(address _addr, bytes32 _key, uint _value) external;

  function getBool(address _addr, bytes32 _key) external view returns (bool);
  function setBool(address _addr, bytes32 _key, bool _value) external;

  function getAddressList(address _addr, bytes32 _key) external view returns (address[]);
  function setAddressList(address _addr, bytes32 _key, address[] _value, uint _len) external;

  function getBytes32List(address _addr, bytes32 _key) external view returns (bytes32[]);
  function setBytes32List(address _addr, bytes32 _key, bytes32[] _value, uint _len) external;

  function getUintList(address _addr, bytes32 _key) external view returns (uint[]);
  function setUintList(address _addr, bytes32 _key, uint[] _value, uint _len) external;

  function getBoolList(address _addr, bytes32 _key) external view returns (bool[]);
  function setBoolList(address _addr, bytes32 _key, bool[] _value, uint _len) external;
}
