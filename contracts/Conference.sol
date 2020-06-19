// SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

interface Conference {
    // GroupAdmin
    event AdminGranted(address indexed grantee);
    event AdminRevoked(address indexed grantee);
    // Ownable
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    // AbstractConference
    event RegisterEvent(address addr, uint256 index);
    event FinalizeEvent(uint256[] maps, uint256 payout, uint256 endedAt);
    event WithdrawEvent(address addr, uint256 payout);
    event SendAndWithdrawEvent(address payable[] addresses, uint256[] values, address addr, uint256 payoutLeft);
    event CancelEvent(uint256 endedAt);
    event ClearEvent(address addr, uint256 leftOver);
    event UpdateParticipantLimit(uint256 limit);

    // Variables
    // Ownable
    function owner() external view returns (address);
     // AbstractConference
    function name() external view returns (string memory);
    function deposit() external view returns (uint256);
    function limitOfParticipants() external view returns (uint256);
    function registered() external view returns (uint256);
    function ended() external view returns (bool);
    function cancelled() external view returns (bool);
    function endedAt() external view returns (uint256);
    function totalAttended() external view returns (uint256);
    function coolingPeriod() external view returns (uint256);
    function payoutAmount() external view returns (uint256);
    function clearFee() external view returns (uint256);
    function lastSent() external view returns (uint256);
    function withdrawn() external view returns (uint256);
    function participants(address participant) external view returns (
        uint256 index,
        address payable addr,
        bool paid
    );
    function participantsIndex(uint256) external view returns(address);
    // Functions
    // Ownable
    function transferOwnership(address payable newOwner) external;
    // Group Admin
    function grant(address[] calldata newAdmins) external;
    function revoke(address[] calldata oldAdmins) external;
    function getAdmins() external view returns(address[] memory);
    function numOfAdmins() external view returns(uint);
    function isAdmin(address admin) external view returns(bool);

    // AbstractConference
    function register() external payable;
    function withdraw() external;
    function sendAndWithdraw(address payable[] calldata, uint256[] calldata) external;
    function totalBalance() external view returns (uint256);
    function isRegistered(address _addr) external view returns (bool);
    function isAttended(address _addr) external view returns (bool);
    function isPaid(address _addr) external view returns (bool);
    function cancel() external;
    function clear() external;
    function clearAndSend() external;
    function clearAndSend(uint256 _num) external;
    function setLimitOfParticipants(uint256 _limitOfParticipants) external;
    function finalize(uint256[] calldata _maps) external;
    function tokenAddress() external view returns (address);
}
