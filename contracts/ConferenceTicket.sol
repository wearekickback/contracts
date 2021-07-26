pragma solidity ^0.5.11;

import './Conference.sol';
import './GroupAdmin.sol';
import './IConferenceTicket.sol';
import {Utils} from './Utils.sol';
import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
//import './zeppelin/ownership/Ownable.sol';

contract ConferenceTicket is IConferenceTicket, ERC721, GroupAdmin {
    // Base Token URI
    string public baseTokenURI;
    address public conferenceAddress;
    Conference public conference;

    // Optional mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;

    modifier onlyAdminOrContract() {
        require(isAdmin(msg.sender) || msg.sender == conferenceAddress, 'must be admin or contract');
        _;
    }

    constructor(string memory _baseTokenUri) public {
        baseTokenURI = _baseTokenUri;
    }

    function setBaseTokenURI(string calldata uri) external onlyAdmin {
        baseTokenURI = uri;
    }
    
    function setConferenceAddress(address _address) external onlyAdmin {
        conferenceAddress = _address;
        conference = Conference(conferenceAddress);
    }     

    function tokenURI(uint256 tokenId) public view returns (string memory) { 
        return string(abi.encodePacked(baseTokenURI, _tokenURI(tokenId)));
    }
    
    /**
     * @dev Internal returns an URI for a given token ID.
     * Throws if the token ID does not exist. May return an empty string.
     * @param tokenId uint256 ID of the token to query
     */
    function _tokenURI(uint256 tokenId) internal view returns (string memory) { 
        require(_exists(tokenId), 'ERC721Metadata: URI query for nonexistent token');
        return _tokenURIs[tokenId];
    }

    /**
     * @dev Mints a new token.
     * @param to The address that will own the minted token
     * @param tokenId uint256 ID of the token to be minted
     */
    function mint(address to, uint256 tokenId) public onlyAdminOrContract {
        _mint(to, tokenId);
        _tokenURIs[tokenId] = Utils.uint2str(tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        super.transferFrom(from, to, tokenId);
        conference.transferTicket(from, to);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public {
        safeTransferFrom(from, to, tokenId, '');
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public {
        transferFrom(from, to, tokenId);
        require(super._checkOnERC721Received(from, to, tokenId, _data), 'ERC721: transfer to non ERC721Receiver implementer');
    }
}
