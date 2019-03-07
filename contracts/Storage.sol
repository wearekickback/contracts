pragma solidity ^0.5.4;

import "./access/RBACWithAdmin.sol";
import "./StorageInterface.sol";

contract Storage is RBACWithAdmin, StorageInterface {
  bytes32 public constant ROLE_WRITER = keccak256("writer");
  bytes32[] private AUTHORIZED_ROLES = [ROLE_WRITER, ROLE_ADMIN];

  struct Data {
    mapping(bytes32 => address) singleAddress;
    mapping(bytes32 => string) singleString;
    mapping(bytes32 => bytes32) singleBytes32;
    mapping(bytes32 => uint256) singleUint256;
    mapping(bytes32 => bool) singleBool;

    mapping(bytes32 => address[]) multipleAddress;
    mapping(bytes32 => bytes32[]) multipleBytes32;
    mapping(bytes32 => uint256[]) multipleUint256;
    mapping(bytes32 => bool[]) multipleBool;
  }

  mapping(address => Data) data;

  modifier isAuthorized () {
    require(hasAnyRole(msg.sender, AUTHORIZED_ROLES));
    _;
  }

  // Address

  function getAddress(address _addr, bytes32 _key) external view returns (address) {
    return data[_addr].singleAddress[_key];
  }

  function setAddress(address _addr, bytes32 _key, address _value) external isAuthorized {
    data[_addr].singleAddress[_key] = _value;
  }

  // String

  function getString(address _addr, bytes32 _key) external view returns (string memory) {
    return data[_addr].singleString[_key];
  }

  function setString(address _addr, bytes32 _key, string calldata _value) external isAuthorized {
    data[_addr].singleString[_key] = _value;
  }

  // Uint

  function getUint(address _addr, bytes32 _key) external view returns (uint256) {
    return data[_addr].singleUint256[_key];
  }

  function setUint(address _addr, bytes32 _key, uint256 _value) external isAuthorized {
    data[_addr].singleUint256[_key] = _value;
  }

  // Bool

  function getBool(address _addr, bytes32 _key) external view returns (bool) {
    return data[_addr].singleBool[_key];
  }

  function setBool(address _addr, bytes32 _key, bool _value) external isAuthorized {
    data[_addr].singleBool[_key] = _value;
  }

  // Bytes32

  function getBytes32(address _addr, bytes32 _key) external view returns (bytes32) {
    return data[_addr].singleBytes32[_key];
  }

  function setBytes32(address _addr, bytes32 _key, bytes32 _value) external isAuthorized {
    data[_addr].singleBytes32[_key] = _value;
  }

  // Address[]

  function getAddressList(address _addr, bytes32 _key) external view returns (address[] memory) {
    return data[_addr].multipleAddress[_key];
  }

  function setAddressList(address _addr, bytes32 _key, address[] calldata _value, uint256 _len) external isAuthorized {
    data[_addr].multipleAddress[_key] = _value;
    data[_addr].multipleAddress[_key].length = _len;
  }

  // Bytes32[]

  function getBytes32List(address _addr, bytes32 _key) external view returns (bytes32[] memory) {
    return data[_addr].multipleBytes32[_key];
  }

  function setBytes32List(address _addr, bytes32 _key, bytes32[] calldata _value, uint256 _len) external isAuthorized {
    data[_addr].multipleBytes32[_key] = _value;
    data[_addr].multipleBytes32[_key].length = _len;
  }

  // Uint[]

  function getUintList(address _addr, bytes32 _key) external view returns (uint256[] memory) {
    return data[_addr].multipleUint256[_key];
  }

  function setUintList(address _addr, bytes32 _key, uint256[] calldata _value, uint256 _len) external isAuthorized {
    data[_addr].multipleUint256[_key] = _value;
    data[_addr].multipleUint256[_key].length = _len;
  }

  // Bool[]

  function getBoolList(address _addr, bytes32 _key) external view returns (bool[] memory) {
    return data[_addr].multipleBool[_key];
  }

  function setBoolList(address _addr, bytes32 _key, bool[] calldata _value, uint256 _len) external isAuthorized {
    data[_addr].multipleBool[_key] = _value;
    data[_addr].multipleBool[_key].length = _len;
  }
}
