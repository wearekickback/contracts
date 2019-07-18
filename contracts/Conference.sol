pragma solidity ^0.5.4;

interface Conference {
    event RegisterEvent(address addr, uint256 index);
    event FinalizeEvent(uint256[] maps, uint256 payout, uint256 endedAt);
    event WithdrawEvent(address addr, uint256 payout);
    event CancelEvent(uint256 endedAt);
    event ClearEvent(address addr, uint256 leftOver);
    event UpdateParticipantLimit(uint256 limit);

    // function doWithdraw(address participant, uint256 amount) internal;
    // function doDeposit(address participant, uint256 amount) internal;

}
