pragma solidity ^0.4.24;

import './Conference.sol';

/**
 * This is responsible for deploying a new Party.
 */
contract Deployer {
    /**
     * Notify that a new party has been deployed.
     */
    event NewParty(
        address indexed deployedAddress,
        address indexed deployer
    );

    /**
     * Deploy a new contract.
     * @param _name The name of the event
     * @param _deposit The amount each participant deposits. The default is set to 0.02 Ether. The amount cannot be changed once deployed.
     * @param _limitOfParticipants The number of participant. The default is set to 20. The number can be changed by the owner of the event.
     * @param _coolingPeriod The period participants should withdraw their deposit after the event ends. After the cooling period, the event owner can claim the remining deposits.
     * @param _encryption A pubic key. The admin can use this public key to encrypt pariticipant username which is stored in event. The admin can later decrypt the name using his/her private key.
     */
    function deploy(
        string _name,
        uint256 _deposit,
        uint _limitOfParticipants,
        uint _coolingPeriod,
        string _encryption
    ) external {
        address owner = msg.sender;

        Conference c = new Conference(
          _name,
          _deposit,
          _limitOfParticipants,
          _coolingPeriod,
          _encryption,
          owner
        );

        emit NewParty(address(c), owner);
    }

    /**
     * Don't allow arbitrary calls
     */
    function () public {
        revert('no fallback function');
    }
}