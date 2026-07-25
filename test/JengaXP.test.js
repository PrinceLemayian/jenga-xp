const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Jenga XP Smart Contracts Suite", function () {
  let JengaBadge, badge;
  let JengaXP, jenga;
  let organizer, member1, member2;

  beforeEach(async function () {
    [organizer, member1, member2] = await ethers.getSigners();

    JengaBadge = await ethers.getContractFactory("JengaBadge");
    badge = await JengaBadge.deploy();
    await badge.waitForDeployment();

    JengaXP = await ethers.getContractFactory("JengaXP");
    jenga = await JengaXP.deploy(await badge.getAddress());
    await jenga.waitForDeployment();

    await badge.setJengaXPContract(await jenga.getAddress());
  });

  describe("Deployment", function () {
    it("Should set correct organizer and badge contract link", async function () {
      expect(await jenga.organizer()).to.equal(organizer.address);
      expect(await jenga.badgeContract()).to.equal(await badge.getAddress());
      expect(await badge.jengaXPContract()).to.equal(await jenga.getAddress());
    });

    it("Should only allow the badge owner to link JengaXP", async function () {
      const FreshBadge = await ethers.getContractFactory("JengaBadge");
      const freshBadge = await FreshBadge.deploy();
      await freshBadge.waitForDeployment();

      await expect(
        freshBadge.connect(member1).setJengaXPContract(await jenga.getAddress())
      ).to.be.revertedWithCustomError(freshBadge, "OnlyOwnerAllowed");
    });
  });

  describe("Event Creation & Organizer Controls", function () {
    it("Should allow organizer to create an event", async function () {
      const tx = await jenga.createEvent("Avalanche Hackathon Meetup");
      await expect(tx)
        .to.emit(jenga, "EventCreated")
        .withArgs(0, "Avalanche Hackathon Meetup");

      const event = await jenga.events(0);
      expect(event.name).to.equal("Avalanche Hackathon Meetup");
      expect(event.exists).to.be.true;
    });

    it("Should revert if non-organizer tries to create event", async function () {
      await expect(
        jenga.connect(member1).createEvent("Unauthorized Event")
      ).to.be.revertedWithCustomError(jenga, "OnlyOrganizerAllowed");
    });

    it("Should revert if non-organizer tries to check in a member", async function () {
      await jenga.createEvent("Organizer Event");

      await expect(
        jenga.connect(member1).checkIn(member1.address, 0)
      ).to.be.revertedWithCustomError(jenga, "OnlyOrganizerAllowed");
    });
  });

  describe("Member Check-In, XP, Streaks and Leveling", function () {
    beforeEach(async function () {
      await jenga.createEvent("Event #1");
    });

    it("Should check in member, award 100 base XP, and mint level 1 badge", async function () {
      await jenga.checkIn(member1.address, 0);

      const m = await jenga.getMember(member1.address);
      expect(m.exists).to.be.true;
      expect(Number(m.xp)).to.equal(100);
      expect(Number(m.level)).to.equal(1);
      expect(Number(m.totalAttendance)).to.equal(1);
      expect(Number(m.streak)).to.equal(1);

      expect(await badge.hasBadge(member1.address, 1)).to.be.true;
    });

    it("Should prevent duplicate check-in to same event", async function () {
      await jenga.checkIn(member1.address, 0);
      await expect(
        jenga.checkIn(member1.address, 0)
      ).to.be.revertedWithCustomError(jenga, "AlreadyCheckedIn");
    });

    it("Should compute level ups and mint level badges dynamically", async function () {
      // Event 0
      await jenga.checkIn(member1.address, 0);
      // Need 300 XP for Level 2 (Regular)
      await jenga.createEvent("Event #2");
      await jenga.checkIn(member1.address, 1); // 200 XP
      await jenga.createEvent("Event #3");
      
      const tx = await jenga.checkIn(member1.address, 2); // 300 XP -> Level Up to 2!
      await expect(tx)
        .to.emit(jenga, "LevelUp")
        .withArgs(member1.address, 2, "Regular");

      const m = await jenga.getMember(member1.address);
      expect(Number(m.level)).to.equal(2);
      expect(await badge.hasBadge(member1.address, 2)).to.be.true;
    });

    it("Should block transfers of soulbound NFT badges", async function () {
      await jenga.checkIn(member1.address, 0);
      expect(await badge.hasBadge(member1.address, 1)).to.be.true;
      const tokenId = await badge.memberBadge(member1.address, 1);

      await expect(
        badge.connect(member1).transferFrom(member1.address, member2.address, tokenId)
      ).to.be.revertedWithCustomError(badge, "SoulboundTransferBlocked");
    });
  });
});
