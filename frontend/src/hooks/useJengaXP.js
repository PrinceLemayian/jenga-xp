import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  JENGA_BADGE_ABI,
  JENGA_BADGE_ADDRESS,
  JENGA_XP_ABI,
  JENGA_XP_ADDRESS,
  FUJI_RPC_URLS,
} from "../constants";

const emptyMember = {
  xp: 0,
  totalAttendance: 0,
  streak: 0,
  level: 1,
  exists: false,
};

/**
 * Ethers.js v6 Skill-aligned error formatting helper
 */
function formatEthersError(err, fallbackMessage) {
  if (!err) return fallbackMessage;
  if (err.code === "ACTION_REJECTED") {
    return "Transaction cancelled by user in wallet.";
  }
  if (err.code === "INSUFFICIENT_FUNDS") {
    return "Insufficient AVAX balance for transaction gas fees.";
  }
  if (err.code === "CALL_EXCEPTION") {
    return err.reason ? `Contract Reverted: ${err.reason}` : "Execution reverted by smart contract.";
  }
  return err.reason || err.message || fallbackMessage;
}

export function useJengaXP(signer, provider, memberAddress) {
  const [memberData, setMemberData] = useState(emptyMember);
  const [communityAverage, setCommunityAverage] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [nextAction, setNextAction] = useState("Attend your first event to start building your reputation.");
  const [xpToNext, setXpToNext] = useState(300);
  const [badges, setBadges] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const contractsReady = Boolean(JENGA_XP_ADDRESS && JENGA_BADGE_ADDRESS);

  const getReadProvider = useCallback(() => {
    if (provider) return provider;
    return new ethers.JsonRpcProvider(FUJI_RPC_URLS[0]);
  }, [provider]);

  const getReadContract = useCallback(() => {
    if (!JENGA_XP_ADDRESS) return null;
    return new ethers.Contract(JENGA_XP_ADDRESS, JENGA_XP_ABI, getReadProvider());
  }, [getReadProvider]);

  const getWriteContract = useCallback(() => {
    if (!signer || !JENGA_XP_ADDRESS) return null;
    return new ethers.Contract(JENGA_XP_ADDRESS, JENGA_XP_ABI, signer);
  }, [signer]);

  const getBadgeContract = useCallback(() => {
    if (!JENGA_BADGE_ADDRESS) return null;
    return new ethers.Contract(JENGA_BADGE_ADDRESS, JENGA_BADGE_ABI, getReadProvider());
  }, [getReadProvider]);

  const fetchMemberData = useCallback(async () => {
    if (!memberAddress || !contractsReady) {
      setMemberData(emptyMember);
      return;
    }

    setLoading(true);
    try {
      let contract = getReadContract();
      let badgeContract = getBadgeContract();
      if (!contract || !badgeContract) return;

      let member, avg, count, action, xpNext, organizerAddr, totalEvents;
      try {
        [member, avg, count, action, xpNext, organizerAddr, totalEvents] = await Promise.all([
          contract.getMember(memberAddress),
          contract.getCommunityAverage(),
          contract.getMemberCount(),
          contract.getNextAction(memberAddress),
          contract.getXPToNextLevel(memberAddress),
          contract.organizer(),
          contract.eventCount(),
        ]);
      } catch (rpcErr) {
        console.warn("Primary provider read failed, falling back to secondary RPC...", rpcErr);
        const fallbackProvider = new ethers.JsonRpcProvider(FUJI_RPC_URLS[1]);
        contract = new ethers.Contract(JENGA_XP_ADDRESS, JENGA_XP_ABI, fallbackProvider);
        badgeContract = new ethers.Contract(JENGA_BADGE_ADDRESS, JENGA_BADGE_ABI, fallbackProvider);

        [member, avg, count, action, xpNext, organizerAddr, totalEvents] = await Promise.all([
          contract.getMember(memberAddress),
          contract.getCommunityAverage(),
          contract.getMemberCount(),
          contract.getNextAction(memberAddress),
          contract.getXPToNextLevel(memberAddress),
          contract.organizer(),
          contract.eventCount(),
        ]);
      }

      const badgeList = [];
      for (let level = 1; level <= 5; level += 1) {
        try {
          if (await badgeContract.hasBadge(memberAddress, level)) badgeList.push(level);
        } catch (e) {
          console.warn(`Badge level ${level} check error:`, e);
        }
      }

      const eventsArr = [];
      const totalEventsNum = Number(totalEvents || 0);
      for (let i = 0; i < totalEventsNum; i++) {
        try {
          const evt = await contract.events(i);
          if (evt.exists) {
            eventsArr.push({
              id: i,
              name: evt.name,
              timestamp: Number(evt.timestamp),
              attendeeCount: Number(evt.attendeeCount),
            });
          }
        } catch (e) {
          console.warn(`Event ${i} fetch error:`, e);
        }
      }

      setMemberData({
        xp: Number(member.xp),
        totalAttendance: Number(member.totalAttendance),
        streak: Number(member.streak),
        level: Number(member.level || 1),
        exists: Boolean(member.exists),
      });
      setCommunityAverage(Number(avg));
      setMemberCount(Number(count));
      setNextAction(action);
      setXpToNext(Number(xpNext));
      setBadges(badgeList);
      setEventsList(eventsArr);
      setIsOrganizer(organizerAddr.toLowerCase() === memberAddress.toLowerCase());
    } catch (err) {
      console.error("Could not load dashboard data:", err);
      setTxError(formatEthersError(err, "Could not load dashboard data."));
    } finally {
      setLoading(false);
    }
  }, [contractsReady, getBadgeContract, getReadContract, memberAddress]);

  useEffect(() => {
    fetchMemberData();
  }, [fetchMemberData]);

  const createEvent = useCallback(async (eventName) => {
    setTxLoading(true);
    setTxError(null);
    setTxHash(null);

    try {
      const contract = getWriteContract();
      if (!contract) throw new Error("Contracts or signer are not configured yet.");

      const tx = await contract.createEvent(eventName);
      setTxHash(tx.hash);
      const receipt = await tx.wait();
      await fetchMemberData();

      return { success: true, txHash: receipt.hash };
    } catch (err) {
      const message = formatEthersError(err, "Could not create event.");
      setTxError(message);
      return { success: false, error: message };
    } finally {
      setTxLoading(false);
    }
  }, [fetchMemberData, getWriteContract]);

  const checkIn = useCallback(async (memberAddr, eventId) => {
    setTxLoading(true);
    setTxError(null);
    setTxHash(null);

    try {
      const contract = getWriteContract();
      if (!contract) throw new Error("Contracts or signer are not configured yet.");

      const tx = await contract.checkIn(memberAddr, eventId);
      setTxHash(tx.hash);
      const receipt = await tx.wait();
      await fetchMemberData();

      return { success: true, txHash: receipt.hash };
    } catch (err) {
      const message = formatEthersError(err, "Could not check in member.");
      setTxError(message);
      return { success: false, error: message };
    } finally {
      setTxLoading(false);
    }
  }, [fetchMemberData, getWriteContract]);

  return {
    memberData,
    communityAverage,
    memberCount,
    nextAction,
    xpToNext,
    badges,
    eventsList,
    isOrganizer,
    loading,
    txLoading,
    txError,
    txHash,
    contractsReady,
    refetch: fetchMemberData,
    createEvent,
    checkIn,
  };
}
