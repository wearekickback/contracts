pragma solidity ^0.5.11;

library Utils {
    function uint2str(uint256 _i)
        internal
        pure
        returns (string memory _uintAsString)
    {
        if (_i == 0) {
            return '0';
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len - 1;
        while (_i != 0) {
            bstr[k--] = bytes1(uint8(48 + (_i % 10)));
            _i /= 10;
        }
        return string(bstr);
    }

    function addr2str(address _address) internal pure returns (string memory) {
        return bytes2str(abi.encodePacked(_address));
    }

    function bytes2str(bytes memory _data) internal pure returns (string memory) {
        bytes memory alphabet = '0123456789abcdef';

        bytes memory str = new bytes(2 + _data.length * 2);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < _data.length; i++) {
            str[2 + i * 2] = alphabet[uint256(uint8(_data[i] >> 4))];
            str[3 + i * 2] = alphabet[uint256(uint8(_data[i] & 0x0f))];
        }
        return string(str);
    }
}
