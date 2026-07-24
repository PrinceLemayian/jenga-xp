// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./JengaBadge.sol";

/**
 * @title JengaXP
 * @notice Gamified community participation tracker on Avalanche Fuji.
 * Manages XP, streaks, leveling, check-ins, and triggers soulbound badge minting.
 */
contract JengaXP {
    struct Member {
        uint256 xp;
        uint256 totalAttendance;
        uint256 streak;           // consecutive months attended
        uint256 lastCheckInMonth; // 1–12
        uint256 lastCheckInYear;  // e.g. 2026
        uint8   level;            // 1–5
        bool    exists;
    }

    struct Event {
        string  name;
        uint256 timestamp;
        uint256 attendeeCount;
        bool    exists;
    }

    address public organizer;
    JengaBadge public badgeContract;

    mapping(address => Member) public members;
    mapping(uint256 => Event)  public events;
    mapping(uint256 => mapping(address => bool)) public hasAttended;

    address[] public memberList;
    uint256 public eventCount;
    uint256 public totalCommunityAttendance;

    uint256 public constant BASE_XP        = 100;
    uint256 public constant STREAK_XP      = 150;
    uint256 public constant STREAK_MINIMUM = 3;

    uint256[6] public LEVEL_THRESHOLDS = [0, 0, 300, 700, 1200, 2000];
    string[6] public LEVEL_NAMES = ["", "Newcomer", "Regular", "Contributor", "Veteran", "Legend"];

    event CheckedIn(address indexed member, uint256 indexed eventId, uint256 xpEarned, uint256 newXP);
    event LevelUp(address indexed member, uint8 newLevel, string levelName);
    event EventCreated(uint256 indexed eventId, string name);

    error OnlyOrganizerAllowed();
    error EventDoesNotExist();
    error AlreadyCheckedIn();
    error InvalidMemberAddress();

    modifier onlyOrganizer() {
        if (msg.sender != organizer) revert OnlyOrganizerAllowed();
        _;
    }

    constructor(address _badgeContract) {
        require(_badgeContract != address(0), "Invalid badge contract address");
        organizer = msg.sender;
        badgeContract = JengaBadge(_badgeContract);
    }

    function createEvent(string memory _name) external onlyOrganizer returns (uint256) {
        require(bytes(_name).length > 0, "Event name cannot be empty");
        uint256 eventId = eventCount;
        events[eventId] = Event({
            name: _name,
            timestamp: block.timestamp,
            attendeeCount: 0,
            exists: true
        });
        eventCount++;
        emit EventCreated(eventId, _name);
        return eventId;
    }

    function checkIn(address _member, uint256 _eventId) external onlyOrganizer {
        if (_member == address(0)) revert InvalidMemberAddress();
        if (!events[_eventId].exists) revert EventDoesNotExist();
        if (hasAttended[_eventId][_member]) revert AlreadyCheckedIn();

        if (!members[_member].exists) {
            members[_member].exists = true;
            members[_member].level  = 1;
            memberList.push(_member);
            badgeContract.mint(_member, 1);
        }

        Member storage m = members[_member];

        (uint256 currentMonth, uint256 currentYear) = _getCurrentMonthYear();

        if (m.totalAttendance == 0) {
            m.streak = 1;
        } else if (currentYear == m.lastCheckInYear && currentMonth == m.lastCheckInMonth) {
            // Same month
        } else if (_isConsecutiveMonth(m.lastCheckInMonth, m.lastCheckInYear, currentMonth, currentYear)) {
            m.streak++;
        } else {
            m.streak = 1;
        }

        m.lastCheckInMonth = currentMonth;
        m.lastCheckInYear  = currentYear;

        uint256 xpEarned = m.streak >= STREAK_MINIMUM ? STREAK_XP : BASE_XP;
        m.xp += xpEarned;
        m.totalAttendance++;
        totalCommunityAttendance++;
        hasAttended[_eventId][_member] = true;
        events[_eventId].attendeeCount++;

        emit CheckedIn(_member, _eventId, xpEarned, m.xp);

        uint8 newLevel = _computeLevel(m.xp);
        if (newLevel > m.level) {
            m.level = newLevel;
            for (uint8 l = 1; l <= newLevel; l++) {
                if (!badgeContract.hasBadge(_member, l)) {
                    badgeContract.mint(_member, l);
                }
            }
            emit LevelUp(_member, newLevel, LEVEL_NAMES[newLevel]);
        }
    }

    function getMember(address _member) external view returns (Member memory) {
        return members[_member];
    }

    function getCommunityAverage() public view returns (uint256) {
        if (memberList.length == 0) return 0;
        return totalCommunityAttendance / memberList.length;
    }

    function getMemberCount() external view returns (uint256) {
        return memberList.length;
    }

    function getXPToNextLevel(address _member) public view returns (uint256) {
        Member storage m = members[_member];
        if (!m.exists) return LEVEL_THRESHOLDS[2];
        if (m.level >= 5) return 0;
        uint256 nextThreshold = LEVEL_THRESHOLDS[m.level + 1];
        if (m.xp >= nextThreshold) return 0;
        return nextThreshold - m.xp;
    }

    function getNextAction(address _member) external view returns (string memory) {
        Member storage m = members[_member];

        if (!m.exists) return "Attend your first event to start building your reputation.";
        if (m.level >= 5) return "You are a Legend. Help others reach this rank.";

        uint256 xpNeeded = getXPToNextLevel(_member);
        string memory nextLevelName = LEVEL_NAMES[m.level + 1];

        if (m.streak >= STREAK_MINIMUM) {
            return string(abi.encodePacked(
                "You need ", _uintToString(xpNeeded), " more XP to reach ", nextLevelName,
                ". Your streak bonus is active (+150 XP per check-in) - keep attending monthly!"
            ));
        } else {
            uint256 monthsToBonus = STREAK_MINIMUM - m.streak;
            return string(abi.encodePacked(
                "You need ", _uintToString(xpNeeded), " more XP to reach ", nextLevelName,
                ". Attend for ", _uintToString(monthsToBonus), " more consecutive month(s) to unlock the +150 XP streak bonus."
            ));
        }
    }

    function _getCurrentMonthYear() internal view returns (uint256 month, uint256 year) {
        uint256 epochDay = block.timestamp / 86400;
        year = 1970 + epochDay / 365;
        month = ((epochDay % 365) / 30) + 1;
        if (month > 12) month = 12;
    }

    function _isConsecutiveMonth(
        uint256 lastMonth, uint256 lastYear,
        uint256 currMonth, uint256 currYear
    ) internal pure returns (bool) {
        if (currYear == lastYear && currMonth == lastMonth + 1) return true;
        if (currYear == lastYear + 1 && lastMonth == 12 && currMonth == 1) return true;
        return false;
    }

    function _computeLevel(uint256 xp) internal view returns (uint8) {
        if (xp >= LEVEL_THRESHOLDS[5]) return 5;
        if (xp >= LEVEL_THRESHOLDS[4]) return 4;
        if (xp >= LEVEL_THRESHOLDS[3]) return 3;
        if (xp >= LEVEL_THRESHOLDS[2]) return 2;
        return 1;
    }

    function _uintToString(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        uint256 temp = v;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (v != 0) { digits--; buffer[digits] = bytes1(uint8(48 + v % 10)); v /= 10; }
        return string(buffer);
    }
}
