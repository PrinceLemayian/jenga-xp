const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const signers = await hre.ethers.getSigners();
  if (!signers || signers.length === 0) {
    console.error("\n❌ ERROR: No deployer wallet found in .env file.");
    console.error("Please create or edit the .env file in the project root with your Avalanche Fuji deployer private key:");
    console.error("PRIVATE_KEY=your_private_key_here\n");
    process.exit(1);
  }

  const deployer = signers[0];
  console.log("==========================================");
  console.log("Deploying Jenga XP Contracts to Avalanche Fuji");
  console.log("Deployer Wallet Address:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer AVAX Balance:", hre.ethers.formatEther(balance), "AVAX");
  console.log("==========================================");

  if (balance === 0n) {
    console.warn("⚠️ WARNING: Your deployer account balance is 0 AVAX.");
    console.warn("Please request testnet AVAX from the Avalanche Fuji faucet: https://core.app/tools/testnet-faucet/\n");
  }

  // 1. Deploy JengaBadge contract first
  console.log("1. Deploying JengaBadge NFT contract...");
  const JengaBadge = await hre.ethers.getContractFactory("JengaBadge");
  const badge = await JengaBadge.deploy();
  await badge.waitForDeployment();
  const badgeAddress = await badge.getAddress();
  console.log("-> JengaBadge deployed to:", badgeAddress);

  // 2. Deploy JengaXP contract passing badge address
  console.log("2. Deploying JengaXP main logic contract...");
  const JengaXP = await hre.ethers.getContractFactory("JengaXP");
  const jenga = await JengaXP.deploy(badgeAddress);
  await jenga.waitForDeployment();
  const jengaAddress = await jenga.getAddress();
  console.log("-> JengaXP deployed to:", jengaAddress);

  // 3. Link badge contract back to main contract
  console.log("3. Linking JengaBadge contract to JengaXP...");
  const tx = await badge.setJengaXPContract(jengaAddress);
  await tx.wait();
  console.log("-> Contracts linked successfully.");

  console.log("\n==========================================");
  console.log("DEPLOYMENT COMPLETE");
  console.log("VITE_JENGA_XP_ADDRESS=" + jengaAddress);
  console.log("VITE_JENGA_BADGE_ADDRESS=" + badgeAddress);
  console.log("==========================================");

  // Auto-update frontend/.env file with deployed addresses
  const envContent = `VITE_JENGA_XP_ADDRESS=${jengaAddress}\nVITE_JENGA_BADGE_ADDRESS=${badgeAddress}\n`;
  const envPath = path.join(__dirname, "..", "frontend", ".env");
  fs.writeFileSync(envPath, envContent);
  console.log("Updated frontend/.env with deployed addresses!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
