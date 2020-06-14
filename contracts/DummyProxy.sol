pragma solidity ^0.5.11;

import './Conference.sol';

contract DummyProxy {
    function registerParticipant(Conference _party, address payable _participant) external payable{
        _party.register.value(msg.value)(_participant);
    }
}
