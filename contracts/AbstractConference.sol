pragma solidity ^0.5.11;

import './GroupAdmin.sol';
import './Conference.sol';
import './Deployer.sol';
import { Utils } from './Utils.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import './zeppelin/security/Pausable.sol';
import 'openzeppelin-solidity/contracts/token/ERC721/ERC721.sol';

contract AbstractConference is Conference, GroupAdmin, ERC721,Pausable {
    using SafeMath for uint256;

    string public name;
    uint256 public deposit;
    uint256 public limitOfParticipants;
    uint256 public registered;
    bool public ended;
    bool public cancelled;
    uint256 public endedAt;
    uint256 public totalAttended;

    uint256 public coolingPeriod;
    uint256 public payoutAmount;
    uint256[] public attendanceMaps;

    uint256 public clearFee;
    uint256 public lastSent = 0;
    uint256 public withdrawn = 0;

    Deployer public deployer;

    mapping (address => Participant) public participants;
    mapping (uint256 => address) public participantsIndex;

    struct Participant {
        uint256 index;
        address payable addr;
        bool paid;
    }

    /* Modifiers */
    modifier onlyActive {
        require(!ended, 'already ended');
        _;
    }

    modifier noOneRegistered {
        require(registered == 0, 'people have already registered');
        _;
    }

    modifier onlyEnded {
        require(ended, 'not yet ended');
        _;
    }

    modifier afterCoolingPeriod {
        require(now > endedAt + coolingPeriod, 'still in cooling period');
        _;
    }
    modifier canWithdraw {
        require(payoutAmount > 0, 'payout is 0');
        Participant storage participant = participants[msg.sender];
        require(participant.addr == msg.sender, 'forbidden access');
        require(cancelled || isAttended(msg.sender), 'event still active or you did not attend');
        require(participant.paid == false, 'already withdrawn');
        _;
    }

    /* Public functions */
    /**
     * @dev Construcotr.
     * @param _name The name of the event
     * @param _deposit The amount each participant deposits. The default is set to 0.02 Ether. The amount cannot be changed once deployed.
     * @param _limitOfParticipants The number of participant. The default is set to 20. The number can be changed by the owner of the event.
     * @param _coolingPeriod The period participants should withdraw their deposit after the event ends. After the cooling period, the event owner can claim the remining deposits.
     * @param _owner The owner of the event
     * @param _clearFee the fee for _clearAndSend function in per-mille (e.g. _clearFee = 10 means 1% fees, _clearFee = 1 means 0.1% fees)
     * @param _deployerAddress The address of the Deployer contract.
     */
    constructor (
        string memory _name,
        uint256 _deposit,
        uint256 _limitOfParticipants,
        uint256 _coolingPeriod,
        address payable _owner,
        uint256 _clearFee,
        address _deployerAddress
    ) public {
        require(_owner != address(0), 'owner address is required');
        owner = _owner;
        name = _name;
        deposit = _deposit;
        limitOfParticipants = _limitOfParticipants;
        coolingPeriod = _coolingPeriod;
        clearFee = _clearFee;
        deployer = Deployer(_deployerAddress);
        if(deployer.isPausable()){
            _pause();
        }
    }


    /**
     * @dev Register for the event
     */
    function register() external payable onlyActive {
        require(registered < limitOfParticipants, 'participant limit reached');
        require(!isRegistered(msg.sender), 'already registered');
        doDeposit(msg.sender, deposit);

        registered = registered.add(1);
        participantsIndex[registered] = msg.sender;
        participants[msg.sender] = Participant(registered, msg.sender, false);

        mint(msg.sender, registered);

        emit RegisterEvent(msg.sender, registered);
    }

    /**
     * @dev Withdraws deposit after the event is over.
     */
    function withdraw() external onlyEnded canWithdraw {
        participants[msg.sender].paid = true;
        withdrawn = withdrawn.add(1);
        doWithdraw(msg.sender, payoutAmount);
        emit WithdrawEvent(msg.sender, payoutAmount);
    }

    /**
    * @dev sendAndWithdraw function allows to split _payoutAmount_ among addresses in _addresses_.
    * 
    * _addresses_ contains ethereum addresses
    * _values_ contains the value of eth/dai to give to addresses
    * 
    * addresses[i] will receive values[i]
    * The function emits the event SendAndWithdrawEvent with the following informations:
    * (addresses, values, participant address, payoutAmount - sum(values), payoutAmount)
    */
    function sendAndWithdraw(address payable[] calldata addresses, uint256[] calldata values) external canWithdraw onlyEnded {
        require(addresses.length == values.length, 'more addresses than values or viceversa');

        participants[msg.sender].paid = true;

        uint256 sumOfValues = 0;
        for(uint i = 0; i < addresses.length; i++) {
            sumOfValues = sumOfValues.add(values[i]);
            
            require(sumOfValues <= payoutAmount, 'payout amount is less than sum of values');

            doWithdraw(addresses[i], values[i]);
        }
                
        uint256 amountLeft = payoutAmount.sub(sumOfValues);
        doWithdraw(msg.sender, amountLeft);
        emit WithdrawEvent(msg.sender, amountLeft);
        emit SendAndWithdrawEvent(addresses, values, msg.sender, amountLeft);
    }

    /* Constants */
    /**
     * @dev Returns total balance of the contract. This function can be deprecated when refactroing front end code.
     * @return The total balance of the contract.
     */
    function totalBalance() view public returns (uint256){
        revert('totalBalance must be impelmented in the child class');
    }

    /**
     * @dev Returns true if the given user is registered.
     * @param _addr The address of a participant.
     * @return True if the address exists in the pariticipant list.
     */
    function isRegistered(address _addr) view public returns (bool){
        return participants[_addr].addr != address(0);
    }

    /**
     * @dev Returns true if the given user is attended.
     * @param _addr The address of a participant.
     * @return True if the user is marked as attended by admin.
     */
    function isAttended(address _addr) public view returns (bool){
        if (!isRegistered(_addr) || !ended) {
            return false;
        }
        // check the attendance maps
        else {
            Participant storage p = participants[_addr];
            uint256 pIndex = p.index.sub(1);
            uint256 map = attendanceMaps[uint256(pIndex.div(256))];
            // Check to see if bit number "pIndex" is set
            return (0 < (map & (2 ** (pIndex.mod(256)))));
        }
    }

    /**
     * @dev Returns true if the given user has withdrawn his/her deposit.
     * @param _addr The address of a participant.
     * @return True if the attendee has withdrawn his/her deposit.
     */
    function isPaid(address _addr) public view returns (bool){
        return isRegistered(_addr) && participants[_addr].paid;
    }

    /* Admin only functions */

    /**
     * @dev Cancels the event by owner. When the event is canceled each participant can withdraw their deposit back.
     */
    function cancel() external onlyAdmin onlyActive {
        payoutAmount = deposit;
        cancelled = true;
        ended = true;
        endedAt = now;
        emit CancelEvent(endedAt);
    }

    /**
    * @dev The event owner transfer the outstanding deposits if there are any unclaimed deposits after cooling period
    */
    function clear() external onlyAdmin onlyEnded afterCoolingPeriod {
        require(withdrawn == totalAttended, 'You can clear the contract only when everybody withdraw!');
        uint256 leftOver = totalBalance();
        doWithdraw(owner, leftOver);
        emit ClearEvent(owner, leftOver);
    }

    /**
    * @dev Anyone that calls the function clear the contract sending 
    * (_payoutAmount_ - fee) to *all* the unpaid attenders. 
    * Fees are aggregated and sent to msg.sender
    */
    function clearAndSend() external onlyEnded afterCoolingPeriod {
        _clearAndSend(totalAttended);
    }

    /**
    * @dev Anyone that calls the function clear the contract sending 
    * (_payoutAmount_ - fee) to the first *_num* unpaid attenders. 
    * Fees are aggregated and sent to msg.sender.
    */
    function clearAndSend(uint256 _num) external onlyEnded afterCoolingPeriod {
        _clearAndSend(_num);
    }


    /**
     * @dev Change the capacity of the event. The owner can change it until event is over.
     * @param _limitOfParticipants the number of the capacity of the event.
     */
    function setLimitOfParticipants(uint256 _limitOfParticipants) external onlyAdmin onlyActive{
        require(registered <= _limitOfParticipants, 'cannot lower than already registered');
        limitOfParticipants = _limitOfParticipants;

        emit UpdateParticipantLimit(limitOfParticipants);
    }


    /**
     * @dev Mark participants as attended and enable payouts. The attendance cannot be undone.
     * @param _maps The attendance status of participants represented by uint256 values.
     */
    function finalize(uint256[] calldata _maps) external onlyAdmin onlyActive {
        uint256 totalBits = _maps.length.mul(256);
        require(totalBits.sub(registered) < 256, 'incorrect no. of bitmaps provided');
        attendanceMaps = _maps;
        ended = true;
        endedAt = now;
        uint256 _totalAttended = 0;
        // calculate total attended
        for (uint256 i = 0; i < attendanceMaps.length; i++) {
            uint256 map = attendanceMaps[i];
            // brian kerninghan bit-counting method - O(log(n))
            while (map != 0) {
                map &= (map.sub(1));
                _totalAttended = _totalAttended.add(1);
            }
        }
        require(_totalAttended <= registered, 'should not have more attendees than registered');
        totalAttended = _totalAttended;

        if (totalAttended > 0) {
            payoutAmount = uint256(totalBalance()).div(totalAttended);
        }

        emit FinalizeEvent(attendanceMaps, payoutAmount, endedAt);
    }

    /**
    * @dev The function clear the contract sending 
    * (_payoutAmount_ - fee) to the first *_num* unpaid attenders.
    * Fees are calculated in this way: (payAmount * clearFee / 1000)
    * Fees are aggregated as (fee * _num) and sent to msg.sender.
    */ 
    function _clearAndSend(uint256 _num) internal onlyEnded afterCoolingPeriod {
        require(withdrawn < totalAttended, 'No more users to clear!');

        uint256 remain = totalAttended - withdrawn;
        _num = (_num < remain) ? _num : remain;

        uint256 fee = payoutAmount.mul(clearFee).div(1000);
        uint256 toAttenders = payoutAmount.sub(fee);

        uint256 totalSent = 0;
        for(uint256 j = lastSent.div(256); totalSent < _num && j < attendanceMaps.length; j++) {
            uint256 map = attendanceMaps[j];
            for(uint256 i = 0; totalSent < _num && i < 256; i++) {
                Participant storage participant = participants[participantsIndex[(j.mul(256).add(i).add(1))]];
                // Check to see if bit number "i" is set but participant has not been paid back
                if(0 < (map & (2 ** i)) && !participant.paid) {
                    participant.paid = true;
                    totalSent = totalSent.add(1);
                    doWithdraw(participant.addr, toAttenders);
                    emit WithdrawEvent(participant.addr, toAttenders);
                }
            }
        }
        lastSent = lastSent.add(totalSent);
        withdrawn = withdrawn.add(totalSent);
        
        uint256 toSender = fee.mul(totalSent);
        doWithdraw(msg.sender, toSender);
        emit ClearEvent(msg.sender, toSender);
    }

    function doDeposit(address /* participant */, uint256 /* amount */ ) internal {
        revert('doDeposit must be impelmented in the child class');
    }

    function doWithdraw(address payable /* participant */ , uint256 /* amount */ ) internal {
        revert('doWithdraw must be impelmented in the child class');
    }

    function tokenAddress() public view returns (address){
        revert('tokenAddress must be impelmented in the child class');
    }

    /* ERC721 implementation start */

    function tokenURI(uint256 tokenId) public view returns (string memory) { 
        return string(abi.encodePacked(deployer.baseTokenUri(), Utils.addr2str(address(this)), '/', _tokenURI(tokenId)));
    }
    
    /**
     * @dev Internal returns an URI for a given token ID.
     * Throws if the token ID does not exist. May return an empty string.
     * @param tokenId uint256 ID of the token to query
     */
    function _tokenURI(uint256 tokenId) internal view returns (string memory) { 
        require(_exists(tokenId), 'ERC721Metadata: URI query for nonexistent token');
        return Utils.uint2str(tokenId);
    }

    /**
     * @dev Mints a new token.
     * @param to The address that will own the minted token
     * @param tokenId uint256 ID of the token to be minted
     */
    function mint(address to, uint256 tokenId) internal {
        _mint(to, tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId) public whenNotPaused {
        require(!isRegistered(to), 'already registered');

        Participant memory participant = participants[from];
        participantsIndex[participant.index] = to;
        participants[from] = Participant(0, address(0), false);
        participants[to] = Participant(participant.index, address(uint160(to)), participant.paid);
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public {
        transferFrom(from, to, tokenId);
        require(super._checkOnERC721Received(from, to, tokenId, _data), 'ERC721: transfer to non ERC721Receiver implementer');
    }

    function pause() public onlyAdmin {
        _pause();
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function unpause() public onlyAdmin {
        _unpause();
    }

    /* ERC721 implementation end */
}
