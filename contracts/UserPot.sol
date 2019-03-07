pragma solidity ^0.5.4;

import "./lifecycle/Upgradeable.sol";
import "./access/RBACWithAdmin.sol";
import "./StorageInterface.sol";
import "./EventInterface.sol";
import "./UserPotInterface.sol";

contract UserPot is Upgradeable, RBACWithAdmin, UserPotInterface {
  bytes32 public constant STORAGE_KEY_EVENTS = keccak256("events");

  bytes32 public constant STORAGE_KEY_BALANCE = keccak256("balance");

  bytes4 public constant INTERFACE_ID = bytes4(keccak256('KickbackUserPot'));

  // can only really do fixed-size arrays in memory, plus loops can be expensive,
  // so we limit the max here. But we should calculate the gas cost of the
  // various methods (especially this one) and then work out a reasonable
  // limit based on that. That limit will then need to be enforced app-side as well
  uint public constant MAX_ACTIVE_EVENTS_PER_USER = 25;

  StorageInterface dataStore;

  constructor (address _dataStore) Upgradeable(INTERFACE_ID) public {
    dataStore = StorageInterface(_dataStore);
  }

  function deposit(address _user) external payable {
    EventInterface event = EventInterface(msg.sender);
    uint256 deposit = event.getDeposit(_user);
    uint256 bal = _getUserTotalPayout(_user);
    bal += msg.value;
    require(bal >= deposit, 'please pay more to register for this event');
    _updateUserData(_user, msg.sender, bal - deposit);
  }

  function withdraw() external {
    uint256 bal = _calculatePayout(msg.sender);
    _updateUserData(msg.sender, address(0), 0);
    msg.sender.transfer(bal);
  }

  /* Update the data associated with this user in the data storage contract.
   *
   * Note: for each user we constantly keep track of the list of non-ended events they have registered to attend as well as
   * the their current ETH balance, based on their previous contract payouts.
   *
   * @param _user Address of the user to update.
   * @param _newEvent The address of the new event they've registered for. If 0 then they haven't registered for a new event.
   * @param _newBalance The user's new ETH leftover balance.
   */
  function _updateUserData(address _user, address _newEvent, uint256 _newBalance) internal {
    address[] memory events = dataStore.getAddressList(_user, STORAGE_KEY_EVENTS);

    address[] memory newEvents = new address[](MAX_ACTIVE_EVENTS_PER_USER);

    uint256 newEventsLen = 0;

    for (uint256 i = 0; i < events.length; i += 1) {
      EventInterface e = EventInterface(events[i]);
      // only count non-ended events, ignore ended ones
      if (!e.hasEnded()) {
        newEvents[newEventsLen] = events[i];
        newEventsLen++;
      }
    }

    // at this point we cannot have total event capacity
    require(newEventsLen < MAX_ACTIVE_EVENTS_PER_USER, 'attending too many events')

    // add a new event to this list?
    if (_newEvent != address(0)) {
      newEvents[newEventsLen] = _newEvent;
      newEventsLen++;
    }

    dataStore.setUint(_user, STORAGE_KEY_BALANCE, _newBalance);
    dataStore.setAddressList(_user, STORAGE_KEY_EVENTS, newEvents, newEventsLen);
  }

  function _getUserTotalPayout(address _user) internal view return (uint256) {
    uint256 bal = dataStore.getUint(_user, STORAGE_KEY_BALANCE);
    address[] memory events = dataStore.getAddressList(_user, STORAGE_KEY_EVENTS);
    for (uint256 i = 0; i < events.length; i += 1) {
        EventInterface e = EventInterface(events[i]);
        // only count ended events
        if (e.hasEnded()) {
            bal += e.getPayout(_user);
        }
    }
    return bal;
  }

  function calculatePayout(address _user) public view returns (uint256) {
    return _getUserTotalPayout(user)
  }

  function calculateDeposit(address _user) public view returns (uint256) {
    uint256 bal = 0;
    address[] memory events = dataStore.getAddressList(_user, STORAGE_KEY_EVENTS);
    for (uint256 i = 0; i < events.length; i += 1) {
        EventInterface e = EventInterface(events[i]);
        if (!e.hasEnded()) {
            bal += e.getDeposit(_user);
        }
    }
    return bal;
  }
}
