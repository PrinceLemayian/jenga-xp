# Jenga XP

Jenga XP is a gamified community participation tracker built on **Avalanche Fuji**.

Members earn XP when organizers check them in to community events. XP drives levels, streaks, and soulbound NFT badges.

---

## Tech Stack

- Solidity
- Hardhat
- React + Vite
- Tailwind CSS
- ethers.js
- Avalanche Fuji Testnet

---

## Project Structure

```text
jenga-xp/
├── contracts/      # Solidity smart contracts
├── scripts/        # Deployment scripts
├── test/           # Contract tests
├── frontend/       # React frontend
└── docs/           # Planning and demo notes
```

---

## Setup

### Install Root Dependencies

```bash
npm install
```

### Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

## Smart Contracts

### Compile Contracts

```bash
npm run compile
```

### Deploy to Avalanche Fuji

```bash
npm run deploy:fuji
```

---

## Frontend

### Run Locally

```bash
cd frontend
npm run dev
```
