export const JENGA_XP_ADDRESS =
  import.meta.env.VITE_JENGA_XP_ADDRESS || "0x5753A16f0fDbf255d08ac6Ecf1a6EAE24d60a5c8";
export const JENGA_BADGE_ADDRESS =
  import.meta.env.VITE_JENGA_BADGE_ADDRESS || "0xb048deA0FAc2b45752DA8eAE77C6e32042408955";

export const FUJI_CHAIN_ID = 43113;
export const FUJI_CHAIN_ID_HEX = "0xA869";

export const FUJI_RPC_URLS = [
  "https://api.avax-test.network/ext/bc/C/rpc",
  "https://avalanche-fuji-c-chain-rpc.publicnode.com",
  "https://rpc.ankr.com/avalanche_fuji-c"
];

export const FUJI_NETWORK = {
  chainId: FUJI_CHAIN_ID_HEX,
  chainName: "Avalanche Fuji Testnet",
  nativeCurrency: {
    name: "AVAX",
    symbol: "AVAX",
    decimals: 18,
  },
  rpcUrls: FUJI_RPC_URLS,
  blockExplorerUrls: ["https://testnet.snowtrace.io"],
};

export const LEVELS = [
  null,
  { name: "Newcomer", xpRequired: 0, color: "#6B7280", emoji: "🌱" },
  { name: "Regular", xpRequired: 300, color: "#3B82F6", emoji: "⚡" },
  { name: "Contributor", xpRequired: 700, color: "#8B5CF6", emoji: "🔥" },
  { name: "Veteran", xpRequired: 1200, color: "#F59E0B", emoji: "🏆" },
  { name: "Legend", xpRequired: 2000, color: "#EF4444", emoji: "👑" },
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
  "function events(uint256) view returns (string name, uint256 timestamp, uint256 attendeeCount, bool exists)",
  "function organizer() view returns (address)",
  "event CheckedIn(address indexed member, uint256 indexed eventId, uint256 xpEarned, uint256 newXP)",
  "event LevelUp(address indexed member, uint8 newLevel, string levelName)",
  "event EventCreated(uint256 indexed eventId, string name)"
];

export const JENGA_BADGE_ABI = [
  "function hasBadge(address, uint8) view returns (bool)",
  "function totalSupply() view returns (uint256)",
];
