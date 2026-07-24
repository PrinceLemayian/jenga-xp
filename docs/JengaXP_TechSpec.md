# Jenga XP — Technical Specification
**Version:** 1.0 | **Hackathon:** Team1 MiniHack Game Jam Cohort 2  
**Problem Statement:** 09 — Community Events & Participation  
**Signature Principle:** Feedback  
**Chain:** Avalanche Fuji Testnet (C-Chain)

---

## 1. Project Summary

Jenga XP is a gamified community participation tracker deployed natively on Avalanche. Every time a community member attends an event, an organizer checks them in on-chain. That check-in earns them XP. XP fills a progress bar. Enough XP and they level up — triggering a soulbound NFT badge minted directly to their wallet.

The app answers the three Routledge feedback questions at all times:
- **Where am I going?** — visible level ladder from Newcomer to Legend
- **How am I doing?** — XP bar, streak counter, community average comparison
- **What's next?** — a specific, auto-generated personal instruction (never generic)

"Jenga" is Swahili for "build." Members are building their community reputation, one event at a time.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity ^0.8.20 |
| Development Framework | Hardhat |
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Wallet Connection | ethers.js v6 + MetaMask |
| Testnet | Avalanche Fuji C-Chain |
| NFT Standard | ERC-721 (Soulbound — transfers blocked) |

### Avalanche Fuji Network Config
```
Network Name: Avalanche Fuji Testnet
RPC URL: https://api.avax-test.network/ext/bc/C/rpc
Chain ID: 43113
Currency Symbol: AVAX
Block Explorer: https://testnet.snowtrace.io
```

---

## 3. Repository Structure

```
jenga-xp/
├── contracts/
│   ├── JengaXP.sol          # Main logic: XP, streaks, levels
│   └── JengaBadge.sol       # Soulbound NFT badges
├── scripts/
│   └── deploy.js            # Deployment script
├── test/
│   └── JengaXP.test.js      # Contract tests
├── hardhat.config.js
├── .env                     # PRIVATE_KEY, RPC_URL
├── .env.example
├── package.json
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── constants.js          # Contract addresses, ABIs, level config
        ├── hooks/
        │   ├── useWallet.js      # MetaMask connection
        │   └── useJengaXP.js     # Contract read/write calls
        └── components/
            ├── ConnectWallet.jsx
            ├── MemberDashboard.jsx
            ├── LevelLadder.jsx
            ├── XPBar.jsx
            ├── StreakDisplay.jsx
            ├── NextActionCard.jsx
            ├── BadgeCollection.jsx
            ├── CommunityStats.jsx
            └── OrganizerPanel.jsx
```

---

## 4. Smart Contracts

### 4.1 JengaXP.sol

This is the main contract. It handles everything except NFT minting.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./JengaBadge.sol";

contract JengaXP {

    // ─── STRUCTS ───────────────────────────────────────────────────────────

    struct Member {
        uint256 xp;
        uint256 totalAttendance;
        uint256 streak;            // consecutive months attended
        uint256 lastCheckInMonth;  // 1–12
        uint256 lastCheckInYear;   // e.g. 2026
        uint8   level;             // 1–5
        bool    exists;
    }

    struct Event {
        string  name;
        uint256 timestamp;
        uint256 attendeeCount;
        bool    exists;
    }

    // ─── STATE ────────────────────────────────────────────────────────────

    address public organizer;
    JengaBadge public badgeContract;

    mapping(address => Member) public members;
    mapping(uint256 => Event)  public events;
    mapping(uint256 => mapping(address => bool)) public hasAttended; // eventId => member => attended

    address[] public memberList;
    uint256 public eventCount;
    uint256 public totalCommunityAttendance;

    // ─── XP CONFIG ────────────────────────────────────────────────────────

    uint256 public constant BASE_XP        = 100;
    uint256 public constant STREAK_XP      = 150; // replaces BASE_XP when streak >= 3
    uint256 public constant STREAK_MINIMUM = 3;   // months before bonus kicks in

    // Level XP thresholds — index = level (1-indexed, index 0 unused)
    uint256[6] public LEVEL_THRESHOLDS = [0, 0, 300, 700, 1200, 2000];

    // Level names — index = level
    string[6] public LEVEL_NAMES = ["", "Newcomer", "Regular", "Contributor", "Veteran", "Legend"];

    // ─── EVENTS ───────────────────────────────────────────────────────────

    event CheckedIn(address indexed member, uint256 indexed eventId, uint256 xpEarned, uint256 newXP);
    event LevelUp(address indexed member, uint8 newLevel, string levelName);
    event EventCreated(uint256 indexed eventId, string name);

    // ─── MODIFIERS ────────────────────────────────────────────────────────

    modifier onlyOrganizer() {
        require(msg.sender == organizer, "Only organizer");
        _;
    }

    // ─── CONSTRUCTOR ──────────────────────────────────────────────────────

    constructor(address _badgeContract) {
        organizer = msg.sender;
        badgeContract = JengaBadge(_badgeContract);
    }

    // ─── ORGANIZER FUNCTIONS ──────────────────────────────────────────────

    function createEvent(string memory _name) external onlyOrganizer returns (uint256) {
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
        require(events[_eventId].exists, "Event does not exist");
        require(!hasAttended[_eventId][_member], "Already checked in to this event");

        // Initialise member if first time
        if (!members[_member].exists) {
            members[_member].exists = true;
            members[_member].level  = 1;
            memberList.push(_member);
        }

        Member storage m = members[_member];

        // ── Streak logic ──────────────────────────────────────────────────
        (uint256 currentMonth, uint256 currentYear) = _getCurrentMonthYear();

        if (m.totalAttendance == 0) {
            // First ever check-in
            m.streak = 1;
        } else if (currentYear == m.lastCheckInYear && currentMonth == m.lastCheckInMonth) {
            // Same month — streak stays the same, still earns XP
        } else if (_isConsecutiveMonth(m.lastCheckInMonth, m.lastCheckInYear, currentMonth, currentYear)) {
            // Next month in sequence — streak grows
            m.streak++;
        } else {
            // Gap — streak resets
            m.streak = 1;
        }

        m.lastCheckInMonth = currentMonth;
        m.lastCheckInYear  = currentYear;

        // ── XP logic ──────────────────────────────────────────────────────
        uint256 xpEarned = m.streak >= STREAK_MINIMUM ? STREAK_XP : BASE_XP;
        m.xp += xpEarned;
        m.totalAttendance++;
        totalCommunityAttendance++;
        hasAttended[_eventId][_member] = true;
        events[_eventId].attendeeCount++;

        emit CheckedIn(_member, _eventId, xpEarned, m.xp);

        // ── Level-up logic ────────────────────────────────────────────────
        uint8 newLevel = _computeLevel(m.xp);
        if (newLevel > m.level) {
            m.level = newLevel;
            badgeContract.mint(_member, newLevel);
            emit LevelUp(_member, newLevel, LEVEL_NAMES[newLevel]);
        }
    }

    // ─── VIEW FUNCTIONS ───────────────────────────────────────────────────

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
        if (m.level >= 5) return 0;
        uint256 nextThreshold = LEVEL_THRESHOLDS[m.level + 1];
        if (m.xp >= nextThreshold) return 0;
        return nextThreshold - m.xp;
    }

    // Returns a human-readable next action string for the dashboard
    function getNextAction(address _member) external view returns (string memory) {
        Member storage m = members[_member];

        if (!m.exists) return "Attend your first event to start building your reputation.";

        if (m.level == 5) return "You are a Legend. Help others reach this rank.";

        uint256 xpNeeded = getXPToNextLevel(_member);
        string memory nextLevelName = LEVEL_NAMES[m.level + 1];

        if (m.streak >= STREAK_MINIMUM) {
            return string(abi.encodePacked(
                "You need ", _uintToString(xpNeeded), " more XP to reach ", nextLevelName,
                ". Your streak bonus is active — keep attending monthly."
            ));
        } else {
            uint256 monthsToBonus = STREAK_MINIMUM - m.streak;
            return string(abi.encodePacked(
                "You need ", _uintToString(xpNeeded), " more XP to reach ", nextLevelName,
                ". Attend for ", _uintToString(monthsToBonus), " more consecutive month(s) to unlock the XP streak bonus."
            ));
        }
    }

    // ─── INTERNAL HELPERS ─────────────────────────────────────────────────

    function _getCurrentMonthYear() internal view returns (uint256 month, uint256 year) {
        // Approximate: 365.25 days/year, 30.44 days/month
        uint256 epochDay   = block.timestamp / 86400;
        year  = 1970 + epochDay / 365;
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
```

---

### 4.2 JengaBadge.sol

Soulbound NFT. Transfers are permanently blocked. Only JengaXP contract can mint.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract JengaBadge is ERC721 {

    address public jengaXPContract;
    uint256 private _tokenIdCounter;

    // tokenId => level
    mapping(uint256 => uint8) public tokenLevel;

    // member => level => tokenId (to avoid duplicate badges)
    mapping(address => mapping(uint8 => uint256)) public memberBadge;
    mapping(address => mapping(uint8 => bool))    public hasBadge;

    string[6] public LEVEL_NAMES = ["", "Newcomer", "Regular", "Contributor", "Veteran", "Legend"];

    event BadgeMinted(address indexed member, uint8 level, uint256 tokenId);

    constructor() ERC721("Jenga XP Badge", "JXPB") {}

    function setJengaXPContract(address _contract) external {
        // Can only be set once
        require(jengaXPContract == address(0), "Already set");
        jengaXPContract = _contract;
    }

    function mint(address _to, uint8 _level) external {
        require(msg.sender == jengaXPContract, "Only JengaXP can mint");
        require(!hasBadge[_to][_level], "Badge already minted for this level");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(_to, tokenId);
        tokenLevel[tokenId] = _level;
        memberBadge[_to][_level] = tokenId;
        hasBadge[_to][_level] = true;

        emit BadgeMinted(_to, _level, tokenId);
    }

    // ── Soulbound: block all transfers ────────────────────────────────────

    function transferFrom(address, address, uint256) public pure override {
        revert("Jenga badges are soulbound and cannot be transferred");
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("Jenga badges are soulbound and cannot be transferred");
    }

    // ── Token URI returns on-chain level name ─────────────────────────────

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(
            "data:application/json;utf8,{",
            '"name":"Jenga XP — ', LEVEL_NAMES[tokenLevel[tokenId]], ' Badge",',
            '"description":"Proof of community participation on Avalanche.",',
            '"level":', _uintToString(tokenLevel[tokenId]),
            "}"
        ));
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

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
}
```

---

## 5. Deployment Script

```javascript
// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1. Deploy badge contract first
  const JengaBadge = await hre.ethers.getContractFactory("JengaBadge");
  const badge = await JengaBadge.deploy();
  await badge.waitForDeployment();
  console.log("JengaBadge deployed to:", await badge.getAddress());

  // 2. Deploy main contract, passing badge address
  const JengaXP = await hre.ethers.getContractFactory("JengaXP");
  const jenga = await JengaXP.deploy(await badge.getAddress());
  await jenga.waitForDeployment();
  console.log("JengaXP deployed to:", await jenga.getAddress());

  // 3. Link badge contract back to main contract
  const tx = await badge.setJengaXPContract(await jenga.getAddress());
  await tx.wait();
  console.log("Contracts linked.");

  console.log("\n--- SAVE THESE ADDRESSES ---");
  console.log("VITE_JENGA_XP_ADDRESS=", await jenga.getAddress());
  console.log("VITE_JENGA_BADGE_ADDRESS=", await badge.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

---

## 6. Hardhat Config

```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
```

---

## 7. Frontend

### 7.1 constants.js

```javascript
// src/constants.js

export const JENGA_XP_ADDRESS   = import.meta.env.VITE_JENGA_XP_ADDRESS;
export const JENGA_BADGE_ADDRESS = import.meta.env.VITE_JENGA_BADGE_ADDRESS;

export const LEVELS = [
  null, // index 0 unused
  { name: "Newcomer",    xpRequired: 0,    color: "#6B7280", emoji: "🌱" },
  { name: "Regular",     xpRequired: 300,  color: "#3B82F6", emoji: "⚡" },
  { name: "Contributor", xpRequired: 700,  color: "#8B5CF6", emoji: "🔥" },
  { name: "Veteran",     xpRequired: 1200, color: "#F59E0B", emoji: "🏆" },
  { name: "Legend",      xpRequired: 2000, color: "#EF4444", emoji: "👑" },
];

export const JENGA_XP_ABI = [
  "function getMember(address) view returns (tuple(uint256 xp, uint256 totalAttendance, uint256 streak, uint256 lastCheckInMonth, uint256 lastCheckInYear, uint8 level, bool exists))",
  "function getCommunityAverage() view returns (uint256)",
  "function getMemberCount() view returns (uint256)",
  "function getXPToNextLevel(address) view returns (uint256)",
  "function getNextAction(address) view returns (string)",
  "function createEvent(string) returns (uint256)",
  "function checkIn(address, uint256)",
  "function eventCount() view returns (uint256)",
  "function organizer() view returns (address)",
  "event CheckedIn(address indexed, uint256 indexed, uint256, uint256)",
  "event LevelUp(address indexed, uint8, string)",
];

export const JENGA_BADGE_ABI = [
  "function hasBadge(address, uint8) view returns (bool)",
  "function totalSupply() view returns (uint256)",
];

export const FUJI_CHAIN_ID = 43113;
```

---

### 7.2 useWallet.js

```javascript
// src/hooks/useWallet.js
import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { FUJI_CHAIN_ID } from "../constants";

export function useWallet() {
  const [address, setAddress]   = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner]     = useState(null);
  const [error, setError]       = useState(null);

  const connect = useCallback(async () => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not installed");

      await window.ethereum.request({ method: "eth_requestAccounts" });
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const network = await web3Provider.getNetwork();

      if (Number(network.chainId) !== FUJI_CHAIN_ID) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xA869" }], // 43113 in hex
        });
      }

      const web3Signer = await web3Provider.getSigner();
      const addr = await web3Signer.getAddress();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAddress(addr);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return { address, provider, signer, error, connect };
}
```

---

### 7.3 useJengaXP.js

```javascript
// src/hooks/useJengaXP.js
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { JENGA_XP_ADDRESS, JENGA_BADGE_ADDRESS, JENGA_XP_ABI, JENGA_BADGE_ABI } from "../constants";

export function useJengaXP(signer, provider, memberAddress) {
  const [memberData,        setMemberData]        = useState(null);
  const [communityAverage,  setCommunityAverage]  = useState(0);
  const [nextAction,        setNextAction]        = useState("");
  const [xpToNext,          setXpToNext]          = useState(0);
  const [badges,            setBadges]            = useState([]);
  const [isOrganizer,       setIsOrganizer]       = useState(false);
  const [loading,           setLoading]           = useState(false);
  const [txLoading,         setTxLoading]         = useState(false);
  const [txError,           setTxError]           = useState(null);

  const getReadContract = useCallback(() => {
    if (!provider) return null;
    return new ethers.Contract(JENGA_XP_ADDRESS, JENGA_XP_ABI, provider);
  }, [provider]);

  const getWriteContract = useCallback(() => {
    if (!signer) return null;
    return new ethers.Contract(JENGA_XP_ADDRESS, JENGA_XP_ABI, signer);
  }, [signer]);

  const getBadgeContract = useCallback(() => {
    if (!provider) return null;
    return new ethers.Contract(JENGA_BADGE_ADDRESS, JENGA_BADGE_ABI, provider);
  }, [provider]);

  const fetchMemberData = useCallback(async () => {
    if (!memberAddress || !provider) return;
    setLoading(true);
    try {
      const contract = getReadContract();
      const badgeContract = getBadgeContract();

      const [member, avg, action, xpNext, organizerAddr] = await Promise.all([
        contract.getMember(memberAddress),
        contract.getCommunityAverage(),
        contract.getNextAction(memberAddress),
        contract.getXPToNextLevel(memberAddress),
        contract.organizer(),
      ]);

      // Check which badges the member holds
      const badgeList = [];
      for (let level = 1; level <= 5; level++) {
        const has = await badgeContract.hasBadge(memberAddress, level);
        if (has) badgeList.push(level);
      }

      setMemberData({
        xp:              Number(member.xp),
        totalAttendance: Number(member.totalAttendance),
        streak:          Number(member.streak),
        level:           Number(member.level),
        exists:          member.exists,
      });
      setCommunityAverage(Number(avg));
      setNextAction(action);
      setXpToNext(Number(xpNext));
      setBadges(badgeList);
      setIsOrganizer(organizerAddr.toLowerCase() === memberAddress.toLowerCase());
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [memberAddress, provider, getReadContract, getBadgeContract]);

  useEffect(() => { fetchMemberData(); }, [fetchMemberData]);

  // ── Organizer actions ──────────────────────────────────────────────────

  const createEvent = useCallback(async (eventName) => {
    setTxLoading(true);
    setTxError(null);
    try {
      const contract = getWriteContract();
      const tx = await contract.createEvent(eventName);
      const receipt = await tx.wait();
      // Extract eventId from logs
      const log = receipt.logs[0];
      return { success: true, txHash: receipt.hash };
    } catch (err) {
      setTxError(err.message);
      return { success: false, error: err.message };
    } finally {
      setTxLoading(false);
    }
  }, [getWriteContract]);

  const checkIn = useCallback(async (memberAddr, eventId) => {
    setTxLoading(true);
    setTxError(null);
    try {
      const contract = getWriteContract();
      const tx = await contract.checkIn(memberAddr, eventId);
      const receipt = await tx.wait();
      await fetchMemberData();
      return { success: true, txHash: receipt.hash };
    } catch (err) {
      setTxError(err.message);
      return { success: false, error: err.message };
    } finally {
      setTxLoading(false);
    }
  }, [getWriteContract, fetchMemberData]);

  return {
    memberData,
    communityAverage,
    nextAction,
    xpToNext,
    badges,
    isOrganizer,
    loading,
    txLoading,
    txError,
    refetch: fetchMemberData,
    createEvent,
    checkIn,
  };
}
```

---

### 7.4 App.jsx

```jsx
// src/App.jsx
import { useWallet }   from "./hooks/useWallet";
import { useJengaXP }  from "./hooks/useJengaXP";
import ConnectWallet   from "./components/ConnectWallet";
import MemberDashboard from "./components/MemberDashboard";
import OrganizerPanel  from "./components/OrganizerPanel";

export default function App() {
  const { address, provider, signer, error: walletError, connect } = useWallet();

  const {
    memberData, communityAverage, nextAction, xpToNext, badges,
    isOrganizer, loading, txLoading, txError,
    createEvent, checkIn, refetch,
  } = useJengaXP(signer, provider, address);

  if (!address) {
    return <ConnectWallet onConnect={connect} error={walletError} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <header className="max-w-2xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-red-500">Jenga XP</h1>
          <p className="text-gray-400 text-sm">Build your community reputation</p>
        </div>
        <span className="text-xs text-gray-500 font-mono">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </header>

      <main className="max-w-2xl mx-auto space-y-6">
        {loading ? (
          <p className="text-center text-gray-400">Loading your profile...</p>
        ) : (
          <MemberDashboard
            memberData={memberData}
            communityAverage={communityAverage}
            nextAction={nextAction}
            xpToNext={xpToNext}
            badges={badges}
          />
        )}

        {isOrganizer && (
          <OrganizerPanel
            onCreateEvent={createEvent}
            onCheckIn={checkIn}
            txLoading={txLoading}
            txError={txError}
            onRefetch={refetch}
          />
        )}
      </main>
    </div>
  );
}
```

---

### 7.5 MemberDashboard.jsx

```jsx
// src/components/MemberDashboard.jsx
import { LEVELS } from "../constants";
import XPBar          from "./XPBar";
import LevelLadder    from "./LevelLadder";
import StreakDisplay   from "./StreakDisplay";
import NextActionCard  from "./NextActionCard";
import BadgeCollection from "./BadgeCollection";
import CommunityStats  from "./CommunityStats";

export default function MemberDashboard({ memberData, communityAverage, nextAction, xpToNext, badges }) {
  if (!memberData || !memberData.exists) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 text-center">
        <p className="text-gray-400">You haven't been checked in to an event yet.</p>
        <p className="text-gray-500 text-sm mt-2">Ask your organizer to check you in to start building XP.</p>
      </div>
    );
  }

  const currentLevel = LEVELS[memberData.level];
  const nextLevel    = LEVELS[memberData.level + 1] || null;

  return (
    <div className="space-y-4">

      {/* Level header */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{currentLevel.emoji}</span>
          <div>
            <p className="text-gray-400 text-sm uppercase tracking-wider">Current Level</p>
            <h2 className="text-2xl font-bold" style={{ color: currentLevel.color }}>
              {currentLevel.name}
            </h2>
          </div>
        </div>
        <XPBar
          currentXP={memberData.xp}
          currentLevel={memberData.level}
          nextLevel={nextLevel}
          xpToNext={xpToNext}
        />
      </div>

      {/* Three feedback questions — clearly labelled */}
      <LevelLadder   currentLevel={memberData.level} />       {/* WHERE AM I GOING? */}
      <CommunityStats attendance={memberData.totalAttendance} average={communityAverage} />  {/* HOW AM I DOING? */}
      <NextActionCard message={nextAction} />                  {/* WHAT'S NEXT? */}

      <StreakDisplay  streak={memberData.streak} />
      <BadgeCollection badges={badges} />
    </div>
  );
}
```

---

### 7.6 Component Specs (Codex should implement these)

#### XPBar.jsx
- Show a filled progress bar
- Label: "{currentXP} / {nextLevelXP} XP"
- If level 5: show "Maximum level reached"
- Color: match current level color from LEVELS constant

#### LevelLadder.jsx
- Label at top: "WHERE AM I GOING?"
- Show all 5 levels as a vertical list
- Current level highlighted with its color + emoji
- Completed levels show a checkmark ✓
- Future levels show in gray
- Each level shows its name and XP requirement

#### StreakDisplay.jsx
- Big number: current streak (in months)
- Label: "month streak"
- If streak >= 3: show "🔥 Bonus XP active — earning 150 XP per check-in"
- If streak < 3: show "Attend for X more consecutive month(s) to unlock bonus XP"

#### NextActionCard.jsx
- Label at top: "WHAT'S NEXT?"
- Bold border on left (red)
- Display the nextAction string from contract
- This is the most important component for judging — make it prominent

#### BadgeCollection.jsx
- Label: "Your Badges"
- Show one card per badge level earned
- Each card shows: emoji, level name, "Soulbound NFT ✓"
- Gray placeholder cards for levels not yet earned

#### CommunityStats.jsx
- Label: "HOW AM I DOING?"
- Show: "You've attended {X} events"
- Show: "Community average: {Y} events"
- If above average: green text "You're above average 🟢"
- If below average: neutral text, encourage them

#### OrganizerPanel.jsx
- Only visible to the organizer wallet
- Section 1 — Create Event: text input for event name + "Create Event" button
- Section 2 — Check In Member: text input for wallet address + event ID input + "Check In" button
- Show loading state during transactions
- Show tx hash link to snowtrace on success: `https://testnet.snowtrace.io/tx/{hash}`
- Show error message on failure

#### ConnectWallet.jsx
- Centered page
- Jenga XP logo/title
- Tagline: "Build your community reputation on-chain."
- "Connect Wallet" button
- Show error if MetaMask not found or wrong network

---

## 8. Environment Variables

```bash
# .env (never commit this)
PRIVATE_KEY=your_deployer_wallet_private_key_here

# frontend/.env
VITE_JENGA_XP_ADDRESS=0x...deployed_address...
VITE_JENGA_BADGE_ADDRESS=0x...deployed_address...
```

---

## 9. Package.json Files

### Root (Hardhat)
```json
{
  "name": "jenga-xp-contracts",
  "scripts": {
    "compile": "hardhat compile",
    "deploy:fuji": "hardhat run scripts/deploy.js --network fuji",
    "test": "hardhat test"
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "hardhat": "^2.22.0",
    "dotenv": "^16.0.0"
  },
  "dependencies": {
    "@openzeppelin/contracts": "^5.0.0"
  }
}
```

### frontend/package.json
```json
{
  "name": "jenga-xp-frontend",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "ethers": "^6.11.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "vite": "^5.0.0"
  }
}
```

---

## 10. Build Order for Tonight

Follow this sequence exactly. Do not skip steps.

```
Step 1 — Setup (15 mins)
  mkdir jenga-xp && cd jenga-xp
  npm init -y
  npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox dotenv
  npm install @openzeppelin/contracts
  npx hardhat init (select "JavaScript project")

Step 2 — Write contracts (45 mins)
  Create contracts/JengaBadge.sol
  Create contracts/JengaXP.sol
  npx hardhat compile — fix any errors before moving on

Step 3 — Deploy to Fuji (20 mins)
  Add .env with PRIVATE_KEY
  Create scripts/deploy.js
  npx hardhat run scripts/deploy.js --network fuji
  Save the two deployed addresses

Step 4 — Frontend setup (15 mins)
  npm create vite@latest frontend -- --template react
  cd frontend && npm install ethers
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p

Step 5 — Build frontend (2–3 hrs)
  Create constants.js with addresses and ABIs
  Build hooks: useWallet.js, useJengaXP.js
  Build components in this order:
    1. ConnectWallet.jsx (get wallet working first)
    2. OrganizerPanel.jsx (test check-in flow)
    3. MemberDashboard.jsx shell
    4. LevelLadder, XPBar, StreakDisplay, NextActionCard, BadgeCollection, CommunityStats

Step 6 — End-to-end test (30 mins)
  Connect wallet as organizer
  Create an event
  Check in a test address
  Verify XP updates on dashboard
  Check level-up triggers badge mint
  Confirm NextActionCard shows specific instruction

Step 7 — Demo prep (15 mins)
  Pre-load a test wallet with 2 events already checked in
  Know exactly which button to click at each stage of demo
  Have Snowtrace open ready to show contract address
```

---

## 11. Demo Script (5:00 AM)

**Minute 1 — The problem**
"Community members attend events and nothing tracks it. No reason to come back. We built Jenga XP — your on-chain community reputation."

**Minute 2 — Show the feedback system**
- Open dashboard for a fresh wallet — show "What's Next" card with a specific instruction
- Check in via Organizer Panel — show XP bar fill live
- Check in twice more — show level-up trigger and badge mint on Snowtrace

**Minute 3 — Prove the feedback works**
- Point at community member in the room
- Ask: *"Without me telling you — what would you do next to level up?"*
- They answer correctly using the dashboard
- Say: *"That's our success criterion met. The system communicated it without us."*

Show contract address on Snowtrace. Done.

---

## 12. Judging Criteria Mapping

| Principle | How Jenga XP Satisfies It | Weight |
|-----------|--------------------------|--------|
| **Feedback** *(Signature)* | Three-question feedback surface: Where am I going (LevelLadder) / How am I doing (CommunityStats) / What's next (NextActionCard) | 20% |
| Choice | Members choose whether to prioritize streak maintenance or event diversity | 15% |
| Pacing | Escalating XP thresholds — Newcomer→Regular is easy, Regular→Legend takes sustained commitment | 15% |
| Practice | Members can see their attendance growing over time; streak resets are recoverable | 15% |
| Enjoyment | Streak tension, level-up moment, soulbound badge identity | 20% |
| Readiness | Simple check-in flow requires no crypto knowledge from the member; organizer does the on-chain action | 15% |

---

*Jenga XP — Team1 MiniHack Game Jam Cohort 2 — Built on Avalanche Fuji*
