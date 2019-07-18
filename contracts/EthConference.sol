pragma solidity ^0.5.4;

import "./AbstractConference.sol";

contract EthConference is AbstractConference {

    function doWithdraw(address participant, uint amount) internal {
        participant.addr.transfer(amount);
    }

    function doDeposit(address, uint amount) internal {
        require(msg.value == amount, 'must send exact deposit amount');
    }
}
