pragma solidity ^0.5.4;

import "./rbac/RBACWithAdmin.sol";
import "./StorageInterface.sol";

contract Storage is RBACWithAdmin, StorageInterface {
  bytes32 public constant ROLE_WRITER = keccak256("writer");

  struct Data {
    mapping(bytes32 => address) singleAddress;
    mapping(bytes32 => string) singleString;
    mapping(bytes32 => bytes32) singleBytes32;
    mapping(bytes32 => uint) singleUint;
    mapping(bytes32 => bool) singleBool;

    mapping(bytes32 => address[]) multipleAddress;
    mapping(bytes32 => bytes32[]) multipleBytes32;
    mapping(bytes32 => uint[]) multipleUint;
    mapping(bytes32 => bool[]) multipleBool;
  }

  mapping(address => Data) data;

  modifier isAuthorized (address _addr) {
    require(hasAnyRole(msg.sender, [ROLE_ADMIN, ROLE_WRITER]));
    _;
  }

  // Address

  function getString(address _addr, bytes32 _key) external view returns (string) {
    return data[_addr].singleAddress[_key];
  }

  function setString(address _addr, bytes32 _key, address _value) external isAuthorized(_addr) {
    data[_addr].singleAddress[_key] = _value;
  }

  // String

  function getString(address _addr, bytes32 _key) external view returns (string) {
    return data[_addr].singleString[_key];
  }

  function setString(address _addr, bytes32 _key, string _value) external isAuthorized(_addr) {
    data[_addr].singleString[_key] = _value;
  }

  // Uint

  function getUint(address _addr, bytes32 _key) external view returns (uint) {
    return data[_addr].singleUint[_key];
  }

  function setUint(address _addr, bytes32 _key, uint _value) external isAuthorized(_addr) {
    data[_addr].singleUint[_key] = _value;
  }

  // Bool

  function getBool(address _addr, bytes32 _key) external view returns (bool) {
    return data[_addr].singleBool[_key];
  }

  function setBool(address _addr, bytes32 _key, bool _value) external isAuthorized(_addr) {
    data[_addr].singleBool[_key] = _value;
  }

  // Bytes32

  function getBytes32(address _addr, bytes32 _key) external view returns (bytes32) {
    return data[_addr].singleBytes32[_key];
  }

  function setBytes32(address _addr, bytes32 _key, bytes32 _value) external isAuthorized(_addr) {
    data[_addr].singleBytes32[_key] = _value;
  }

  // Address[]

  function getAddressList(address _addr, bytes32 _key) external view returns (address[]) {
    return data[_addr].multipleAddress[_key];
  }

  function setAddressList(address _addr, bytes32 _key, address[] _value, uint _len) external isAuthorized(_addr) {
    data[_addr].multipleAddress[_key] = _value;
    data[_addr].multipleAddress[_key].length = _len;
  }

  // Bytes32[]

  function getBytes32List(address _addr, bytes32 _key) external view returns (bytes32[]) {
    return data[_addr].multipleBytes32[_key];
  }

  function setBytes32List(address _addr, bytes32 _key, bytes32[] _value, uint _len) external isAuthorized(_addr) {
    data[_addr].multipleBytes32[_key] = _value;
    data[_addr].multipleBytes32[_key].length = _len;
  }

  // Uint[]

  function getUintList(address _addr, bytes32 _key) external view returns (uint[]) {
    return data[_addr].multipleUint[_key];
  }

  function setUintList(address _addr, bytes32 _key, uint[] _value, uint _len) external isAuthorized(_addr) {
    data[_addr].multipleUint[_key] = _value;
    data[_addr].multipleUint[_key].length = _len;
  }

  // Bool[]

  function getBoolList(address _addr, bytes32 _key) external view returns (bool[]) {
    return data[_addr].multipleBool[_key];
  }

  function setBoolList(address _addr, bytes32 _key, bool[] _value, uint _len) external isAuthorized(_addr) {
    data[_addr].multipleBool[_key] = _value;
    data[_addr].multipleBool[_key].length = _len;
  }
}
