# Jenga XP

Jenga XP is a gamified community participation tracker built on Avalanche Fuji. Organizers create community events and check members in on-chain. Members earn XP, build streaks, level up, and receive soulbound NFT badges that represent real participation.

Communities often run events, workshops, meetups, and hackathons, but participation usually disappears after the event ends. Jenga XP turns that attendance into visible progress and verifiable reputation. Members can see where they are, how they are doing, and exactly what to do next, while organizers get a simple on-chain check-in flow.

## Problem

Community participation is usually tracked through spreadsheets, manual lists, photos, or memory. That creates a few problems:

- Members do not have a trusted record of their participation.
- Organizers struggle to recognize consistent contributors.
- Attendance history is hard to verify after the event.
- Community growth lacks feedback, motivation, and progression.
- Badges or rewards can become meaningless if they are transferable or manually assigned without proof.

## Solution

Jenga XP solves this by creating an on-chain feedback loop for community participation.

1. An organizer creates an event.
2. The organizer checks in a member wallet.
3. The member earns XP.
4. Their streak and attendance count update.
5. Their level progresses from Newcomer to Legend.
6. When they level up, they receive a soulbound NFT badge.
7. The dashboard tells them what to do next.

The product is built around three feedback questions:

```txt
Where am I going?  -> Level ladder
How am I doing?   -> XP, streak, attendance, community average
What is next?     -> Specific next action
```

## Why Avalanche

Avalanche Fuji makes this project practical for live community events because it provides:

- Fast transaction confirmation for check-ins during events.
- Low-cost testnet deployment and usage.
- EVM compatibility, so the team can use Solidity, Hardhat, ethers.js, and MetaMask.
- Transparent on-chain proof of participation.
- Easy integration with existing wallet tooling.

## Core Features

- Wallet connection through MetaMask.
- Avalanche Fuji network support.
- Organizer-only event creation.
- Organizer-only member check-in.
- XP tracking per wallet.
- Monthly streak tracking.
- Level progression from Newcomer to Legend.
- Soulbound ERC-721 badges.
- Member dashboard with progress and next action.
- Organizer hub for event management.
- QR code support for wallet and event flows.
- Snowtrace transaction links after successful writes.

## Tech Stack

| Layer                     | Technology                      |
| ------------------------- | ------------------------------- |
| Smart contracts           | Solidity `^0.8.20`              |
| Contract framework        | Hardhat                         |
| Contract libraries        | OpenZeppelin Contracts          |
| Frontend                  | React + Vite                    |
| Styling                   | Tailwind CSS                    |
| Wallet and contract calls | ethers.js v6                    |
| Chain                     | Avalanche Fuji Testnet          |
| Explorer                  | Snowtrace Testnet               |
| Deployment                | Vercel frontend, Fuji contracts |

## Repository Structure

```txt
jenga-xp/
|-- contracts/
|   |-- JengaXP.sol
|   `-- JengaBadge.sol
|-- scripts/
|   `-- deploy.js
|-- test/
|   `-- JengaXP.test.js
|-- docs/
|-- frontend/
|   |-- index.html
|   |-- package.json
|   |-- vite.config.js
|   |-- tailwind.config.js
|   |-- postcss.config.js
|   `-- src/
|       |-- main.jsx
|       |-- App.jsx
|       |-- constants.js
|       |-- hooks/
|       |   |-- useWallet.js
|       |   `-- useJengaXP.js
|       `-- components/
|           |-- ConnectWallet.jsx
|           |-- MemberDashboard.jsx
|           |-- OrganizerPanel.jsx
|           |-- QRCodeModal.jsx
|           |-- QRScannerModal.jsx
|           |-- XPBar.jsx
|           |-- LevelLadder.jsx
|           |-- StreakDisplay.jsx
|           |-- NextActionCard.jsx
|           |-- BadgeCollection.jsx
|           |-- CommunityStats.jsx
|           `-- Icon.jsx
|-- hardhat.config.js
|-- package.json
|-- .env.example
|-- .gitignore
`-- README.md
```

## Smart Contracts

### `JengaXP.sol`

Main application contract. It manages:

- Organizer permissions.
- Event creation.
- Member check-ins.
- XP awards.
- Streak logic.
- Level calculation.
- Community averages.
- Next-action messages.
- Badge minting triggers.

### `JengaBadge.sol`

Soulbound ERC-721 badge contract. It manages:

- Badge minting by the `JengaXP` contract only.
- One badge per member per level.
- Transfer blocking.
- On-chain token metadata.
- Owner-only linking to the main `JengaXP` contract.

## Levels

| Level | Name        | XP Required |
| ----- | ----------- | ----------: |
| 1     | Newcomer    |           0 |
| 2     | Regular     |         300 |
| 3     | Contributor |         700 |
| 4     | Veteran     |        1200 |
| 5     | Legend      |        2000 |

## XP Rules

| Action                            |     XP |
| --------------------------------- | -----: |
| Normal event check-in             | 100 XP |
| Check-in with active streak bonus | 150 XP |

The streak bonus starts once a member reaches the configured streak threshold.

## Prerequisites

Install these before running the project:

- Node.js LTS, preferably Node 20.
- npm.
- Git.
- MetaMask browser extension.
- A wallet funded with Fuji AVAX for deployment and organizer transactions.

Hardhat may warn on unsupported Node versions. If you hit strange compile or deploy issues, switch to Node 20 LTS.

## Avalanche Fuji Network

Add this network to MetaMask:

```txt
Network Name: Avalanche Fuji Testnet
RPC URL: https://api.avax-test.network/ext/bc/C/rpc
Chain ID: 43113
Currency Symbol: AVAX
Block Explorer URL: https://testnet.snowtrace.io
```

Get test AVAX from the Avalanche faucet:

```txt
https://core.app/tools/testnet-faucet/
```

## Local Setup

Clone the repo:

```bash
git clone https://github.com/YOUR_USERNAME/jenga-xp.git
cd jenga-xp
```

Install root dependencies:

```bash
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

Create environment files:

```bash
copy .env.example .env
copy frontend\.env.example frontend\.env
```

On Mac/Linux:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

Never commit `.env` files.

## Environment Variables

Root `.env`:

```env
PRIVATE_KEY=your_organizer_or_deployer_private_key_here
```

Frontend `frontend/.env`:

```env
VITE_JENGA_XP_ADDRESS=0x_your_deployed_jenga_xp_contract
VITE_JENGA_BADGE_ADDRESS=0x_your_deployed_jenga_badge_contract
```

The root private key is used by Hardhat for deployment. The frontend variables are used by Vite at build time.

## Important Wallet Roles

### Organizer Wallet

The organizer wallet is the wallet that deploys the `JengaXP` contract. This wallet can:

- Create events.
- Check in members.
- Trigger XP and badge updates.

If the Organizer Hub does not appear in the app, you are probably not connected with the deployer wallet.

### Member Wallet

A member wallet is any participant wallet. Members can:

- Connect to the app.
- View XP, level, streak, badges, and next action.
- Show their wallet QR code to organizers.

Members do not need Fuji AVAX for the core demo because the organizer pays gas for check-ins.

## Contract Commands

Compile contracts:

```bash
npm run compile
```

Run contract tests:

```bash
npm test
```

Deploy to Avalanche Fuji:

```bash
npm run deploy:fuji
```

After deployment, copy the printed contract addresses into `frontend/.env`:

```env
VITE_JENGA_XP_ADDRESS=0x...
VITE_JENGA_BADGE_ADDRESS=0x...
```

## Frontend Commands

Run the frontend locally:

```bash
cd frontend
npm run dev
```

Build the frontend:

```bash
cd frontend
npm run build
```

Preview the production build:

```bash
cd frontend
npm run preview
```

## Deployment Flow

### 1. Deploy Contracts

Make sure root `.env` contains the deployer private key:

```env
PRIVATE_KEY=...
```

Then run:

```bash
npm run deploy:fuji
```

The deploy script deploys:

1. `JengaBadge`
2. `JengaXP`
3. Links `JengaBadge` to `JengaXP`
4. Prints frontend environment variables

### 2. Configure Frontend

Set the deployed addresses in `frontend/.env`:

```env
VITE_JENGA_XP_ADDRESS=0x...
VITE_JENGA_BADGE_ADDRESS=0x...
```

### 3. Build Frontend

```bash
cd frontend
npm run build
```

### 4. Deploy Frontend To Vercel

When importing the GitHub repo into Vercel, use these settings:

```txt
Framework Preset: Vite
Root Directory: frontend
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

Add these Vercel environment variables for Production and Preview:

```env
VITE_JENGA_XP_ADDRESS=0x...
VITE_JENGA_BADGE_ADDRESS=0x...
```

After changing Vercel environment variables, redeploy the app because Vite reads `VITE_` variables at build time.

## Demo Flow

Use two wallets:

```txt
Wallet 1: Organizer wallet, same wallet that deployed contracts
Wallet 2: Member wallet, demo participant
```

Recommended flow:

1. Connect as the member.
2. Show the empty member dashboard.
3. Point out level, XP bar, badges, and next action.
4. Switch MetaMask to the organizer wallet.
5. Open Organizer Hub.
6. Create an event.
7. Paste or scan the member wallet address.
8. Submit check-in.
9. Wait for transaction confirmation.
10. Switch back to the member wallet.
11. Refresh or reconnect.
12. Show updated XP, streak, attendance, and badge.

### Why soulbound NFTs?

Reputation should be earned, not bought or transferred. Soulbound badges ensure that participation badges stay with the wallet that earned them.

### Why Avalanche?

Avalanche provides fast, low-cost, EVM-compatible transactions. That makes it practical for live community check-ins and allowed the team to build quickly with familiar Ethereum tooling.

### Who are the users?

Organizers create events and check members in. Members view their XP, streaks, levels, badges, and next action.

### How is this different from POAPs?

POAPs usually prove attendance at a single event. Jenga XP tracks long-term growth through XP, streaks, levels, community comparison, and next-action feedback.

### What happens if a member has no AVAX?

That is fine for the core flow. The organizer pays gas when checking the member in.

### What is the future vision?

Jenga XP could support community roles, leaderboards, event perks, DAO participation gates, recurring event analytics, and portable community reputation across ecosystems.

## Team Workflow

Recommended branches:

```txt
main        stable working code
contracts   smart contracts, tests, deployment
hooks       wallet and contract data flow
ui          components, styling, UX
```

Before working:

```bash
git checkout main
git pull
```

Create or switch to your branch:

```bash
git checkout -b ui
```

Commit changes:

```bash
git status
git add .
git commit -m "feat: describe your change"
git push
```

Use conventional commit prefixes when possible:

```txt
feat: new user-facing feature
fix: bug fix
docs: README or documentation change
chore: tooling, dependency, or setup change
test: test changes
style: formatting or visual-only polish
```

## Troubleshooting

### Organizer Hub does not appear

Make sure MetaMask is connected with the deployer wallet. The organizer is set in the contract constructor during deployment.

### Transactions fail in MetaMask

Check that:

- You are on Avalanche Fuji.
- The organizer wallet has Fuji AVAX.
- The frontend environment variables point to the deployed contracts.
- You are using the organizer wallet for event creation and check-ins.

### Frontend says contract addresses are not configured

Set these in `frontend/.env`:

```env
VITE_JENGA_XP_ADDRESS=0x...
VITE_JENGA_BADGE_ADDRESS=0x...
```

Then restart the frontend dev server.

### Vercel deployment has blank addresses

Add the same `VITE_` variables in Vercel Project Settings, then redeploy.

### Hardhat warns about Node version

Use Node 20 LTS if possible.

### npm audit shows vulnerabilities

Do not immediately run `npm audit fix --force` during the hackathon. It may upgrade Hardhat dependencies in a breaking way. Run tests first and only upgrade intentionally.

## Security Notes

- Never commit `.env` files.
- Never expose a real mainnet private key.
- Use a test wallet for Fuji deployment.
- The badge contract link is owner-restricted.
- Badges are soulbound and cannot be transferred.
- Only the organizer can create events and check in members.

## License

This project was created for a hackathon. Add a license before using it in production or publishing it as an open-source project.
