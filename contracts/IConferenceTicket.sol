pragma solidity ^0.5.11;

interface IConferenceTicket {
  function setBaseTokenURI(string calldata uri) external;
  function setConferenceAddress(address _address) external;
  function tokenURI(uint256 tokenId) external view returns (string memory);
  function mint(address to, uint256 tokenId) external;
}