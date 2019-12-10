pragma solidity ^0.5.11;

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
    event SendAndWithdraw(address payable[] addresses, uint256[] values, address addr, uint256 payoutLeft);
    event CancelEvent(uint256 endedAt);
    event ClearEvent(address addr, uint256 leftOver);
    event UpdateParticipantLimit(uint256 limit);

    // Variables
    // Ownable
    function owner() view external returns (address);
     // AbstractConference
    function name() view external returns (string memory);
    function deposit() view external returns (uint256);
    function limitOfParticipants() view external returns (uint256);
    function registered() view external returns (uint256);
    function ended() view external returns (bool);
    function cancelled() view external returns (bool);
    function endedAt() view external returns (uint256);
    function totalAttended() view external returns (uint256);
    function coolingPeriod() view external returns (uint256);
    function payoutAmount() view external returns (uint256);
    function participants(address participant) view external returns (
        uint256 index,
        address payable addr,
        bool paid
    );
    function participantsIndex(uint256) view external returns(address);
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
    function totalBalance() view external returns (uint256);
    function isRegistered(address _addr) view external returns (bool);
    function isAttended(address _addr) external view returns (bool);
    function isPaid(address _addr) external view returns (bool);
    function cancel() external;
    function clear() external;
    function setLimitOfParticipants(uint256 _limitOfParticipants) external;
    function changeName(string calldata _name) external;
    function changeDeposit(uint256 _deposit) external;
    function finalize(uint256[] calldata _maps) external;
    function tokenAddress() external view returns (address);
}
