# Jenga XP

Jenga XP is a gamified community participation tracker for community events. Organizers check members in on-chain, members earn XP, XP drives levels and streaks, and level-ups mint soulbound NFT badges.

The project is split into three work lanes so the team can move quickly during the hackathon:

- `contracts` - smart contracts, tests, and deployment
- `hooks` - wallet connection, contract reads/writes, and app data flow
- `ui` - React components, layout, and styling

## Tech Stack

- Solidity `^0.8.20`
- Hardhat
- OpenZeppelin Contracts
- React + Vite
- Tailwind CSS
- ethers.js v6
- Avalanche Fuji Testnet

## Project Structure

```txt
jenga-xp/
├── contracts/
│   ├── JengaXP.sol
│   └── JengaBadge.sol
├── scripts/
│   └── deploy.js
├── test/
│   └── JengaXP.test.js
├── docs/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── constants.js
│       ├── hooks/
│       │   ├── useWallet.js
│       │   └── useJengaXP.js
│       └── components/
│           ├── ConnectWallet.jsx
│           ├── MemberDashboard.jsx
│           ├── OrganizerPanel.jsx
│           ├── XPBar.jsx
│           ├── LevelLadder.jsx
│           ├── StreakDisplay.jsx
│           ├── NextActionCard.jsx
│           ├── BadgeCollection.jsx
│           └── CommunityStats.jsx
├── hardhat.config.js
├── package.json
├── .env.example
└── README.md
```

## Shared Setup For Everyone

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

Create local environment files:

```bash
copy .env.example .env
copy frontend\.env.example frontend\.env
```

On Mac/Linux, use:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

Never commit `.env` files.

## Environment Variables

Root `.env`:

```env
PRIVATE_KEY=your_deployer_wallet_private_key_here
```

Frontend `frontend/.env`:

```env
VITE_JENGA_XP_ADDRESS=0x_your_deployed_jenga_xp_contract
VITE_JENGA_BADGE_ADDRESS=0x_your_deployed_jenga_badge_contract
```

Before contracts are deployed, frontend developers can leave the addresses blank and build with dummy UI data.

## Branch Workflow

Use one branch per lane:

```txt
main        stable working code only
contracts   smart contracts and deployment
hooks       wallet, contract calls, app data flow
ui          components and styling
```

Switch to your lane:

```bash
git checkout contracts
```

or:

```bash
git checkout hooks
```

or:

```bash
git checkout ui
```

Before starting work each time:

```bash
git pull
```

After making changes:

```bash
git status
git add .
git commit -m "Describe your change"
git push
```

Merge into `main` only at agreed checkpoints:

1. Contracts compile and deploy successfully.
2. Frontend connects to the deployed contracts and works end-to-end.

## Lane 1: Contracts

Use the `contracts` branch:

```bash
git checkout contracts
```

You own:

- `contracts/JengaXP.sol`
- `contracts/JengaBadge.sol`
- `scripts/deploy.js`
- `hardhat.config.js`
- `test/JengaXP.test.js`

Compile contracts:

```bash
npx hardhat compile
```

Run tests:

```bash
npx hardhat test
```

Deploy to Avalanche Fuji:

```bash
npx hardhat run scripts/deploy.js --network fuji
```

After deployment, copy the printed contract addresses into `frontend/.env`:

```env
VITE_JENGA_XP_ADDRESS=0x...
VITE_JENGA_BADGE_ADDRESS=0x...
```

Then tell the hooks and UI lanes the addresses are ready.

## Lane 2: Hooks And Data

Use the `hooks` branch:

```bash
git checkout hooks
```

You own:

- `frontend/src/constants.js`
- `frontend/src/hooks/useWallet.js`
- `frontend/src/hooks/useJengaXP.js`
- `frontend/src/App.jsx`

Start by making wallet connection work:

```bash
cd frontend
npm run dev
```

If `npm run dev` is missing, add this to `frontend/package.json` under `scripts`:

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

Build order:

1. `constants.js` - contract addresses, ABIs, Fuji chain ID, level config.
2. `useWallet.js` - connect MetaMask and switch to Fuji.
3. `useJengaXP.js` - read member data, community average, badges, organizer status.
4. `App.jsx` - pass wallet and contract data into UI components.

You can use dummy data until the contracts lane deploys.

## Lane 3: UI Components

Use the `ui` branch:

```bash
git checkout ui
```

You own:

- `frontend/src/components/ConnectWallet.jsx`
- `frontend/src/components/MemberDashboard.jsx`
- `frontend/src/components/OrganizerPanel.jsx`
- `frontend/src/components/XPBar.jsx`
- `frontend/src/components/LevelLadder.jsx`
- `frontend/src/components/StreakDisplay.jsx`
- `frontend/src/components/NextActionCard.jsx`
- `frontend/src/components/BadgeCollection.jsx`
- `frontend/src/components/CommunityStats.jsx`
- Tailwind styling files

Run the frontend:

```bash
cd frontend
npm run dev
```

If `npm run dev` is missing, add this to `frontend/package.json` under `scripts`:

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

Build order:

1. `ConnectWallet.jsx`
2. `OrganizerPanel.jsx`
3. `MemberDashboard.jsx`
4. `LevelLadder.jsx`
5. `XPBar.jsx`
6. `StreakDisplay.jsx`
7. `NextActionCard.jsx`
8. `BadgeCollection.jsx`
9. `CommunityStats.jsx`

The judging focus is feedback, so make these three sections clear:

- Where am I going? `LevelLadder`
- How am I doing? `CommunityStats`
- What's next? `NextActionCard`

## Avalanche Fuji Details

Add this network to MetaMask:

```txt
Network Name: Avalanche Fuji Testnet
RPC URL: https://api.avax-test.network/ext/bc/C/rpc
Chain ID: 43113
Currency Symbol: AVAX
Block Explorer: https://testnet.snowtrace.io
```

## Demo Checklist

Before the demo:

1. Contracts compile.
2. Contracts deploy to Fuji.
3. Frontend `.env` contains deployed contract addresses.
4. Organizer wallet can connect.
5. Organizer can create an event.
6. Organizer can check in a member wallet.
7. Member dashboard shows XP, streak, level, next action, and badges.
8. Snowtrace transaction links work.

## Common Commands

Root project:

```bash
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network fuji
```

Frontend:

```bash
cd frontend
npm install
npm run dev
npm run build
```

Git:

```bash
git status
git add .
git commit -m "Your message"
git push
git pull
```
