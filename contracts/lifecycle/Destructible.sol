pragma solidity ^0.5.4;

import "../access/RBACWithAdmin.sol";

/**
 * @title Destructible
 * @dev Base contract that can be destroyed by owner. All funds in contract will be sent to the owner.
 */
contract Destructible is RBACWithAdmin {
  /**
   * @dev Transfers the current balance to the owner and terminates the contract.
   */
  function destroy() onlyAdmin public {
    selfdestruct(msg.sender);
  }
}
