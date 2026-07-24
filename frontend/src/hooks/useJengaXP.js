import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  JENGA_BADGE_ABI,
  JENGA_BADGE_ADDRESS,
  JENGA_XP_ABI,
  JENGA_XP_ADDRESS,
} from "../constants";

const emptyMember = {
  xp: 0,
  totalAttendance: 0,
  streak: 0,
  level: 1,
  exists: false,
};

export function useJengaXP(signer, provider, memberAddress) {
  const [memberData, setMemberData] = useState(emptyMember);
  const [communityAverage, setCommunityAverage] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [nextAction, setNextAction] = useState("Attend your first event to start building your reputation.");
  const [xpToNext, setXpToNext] = useState(300);
  const [badges, setBadges] = useState([]);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState(null);

  const contractsReady = Boolean(provider && JENGA_XP_ADDRESS && JENGA_BADGE_ADDRESS);

  const getReadContract = useCallback(() => {
    if (!provider || !JENGA_XP_ADDRESS) return null;
    return new ethers.Contract(JENGA_XP_ADDRESS, JENGA_XP_ABI, provider);
  }, [provider]);

  const getWriteContract = useCallback(() => {
    if (!signer || !JENGA_XP_ADDRESS) return null;
    return new ethers.Contract(JENGA_XP_ADDRESS, JENGA_XP_ABI, signer);
  }, [signer]);

  const getBadgeContract = useCallback(() => {
    if (!provider || !JENGA_BADGE_ADDRESS) return null;
    return new ethers.Contract(JENGA_BADGE_ADDRESS, JENGA_BADGE_ABI, provider);
  }, [provider]);

  const fetchMemberData = useCallback(async () => {
    if (!memberAddress || !contractsReady) {
      setMemberData(emptyMember);
      return;
    }

    setLoading(true);
    try {
      const contract = getReadContract();
      const badgeContract = getBadgeContract();

      const [member, avg, count, action, xpNext, organizerAddr] = await Promise.all([
        contract.getMember(memberAddress),
        contract.getCommunityAverage(),
        contract.getMemberCount(),
        contract.getNextAction(memberAddress),
        contract.getXPToNextLevel(memberAddress),
        contract.organizer(),
      ]);

      const badgeList = [];
      for (let level = 1; level <= 5; level += 1) {
        if (await badgeContract.hasBadge(memberAddress, level)) badgeList.push(level);
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
      setIsOrganizer(organizerAddr.toLowerCase() === memberAddress.toLowerCase());
    } catch (err) {
      setTxError(err.message || "Could not load dashboard data.");
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

    try {
      const contract = getWriteContract();
      if (!contract) throw new Error("Contracts are not configured yet.");

      const tx = await contract.createEvent(eventName);
      const receipt = await tx.wait();
      await fetchMemberData();

      return { success: true, txHash: receipt.hash };
    } catch (err) {
      const message = err.reason || err.message || "Could not create event.";
      setTxError(message);
      return { success: false, error: message };
    } finally {
      setTxLoading(false);
    }
  }, [fetchMemberData, getWriteContract]);

  const checkIn = useCallback(async (memberAddr, eventId) => {
    setTxLoading(true);
    setTxError(null);

    try {
      const contract = getWriteContract();
      if (!contract) throw new Error("Contracts are not configured yet.");

      const tx = await contract.checkIn(memberAddr, eventId);
      const receipt = await tx.wait();
      await fetchMemberData();

      return { success: true, txHash: receipt.hash };
    } catch (err) {
      const message = err.reason || err.message || "Could not check in member.";
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
    isOrganizer,
    loading,
    txLoading,
    txError,
    contractsReady,
    refetch: fetchMemberData,
    createEvent,
    checkIn,
  };
}
