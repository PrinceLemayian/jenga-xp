# How to Split the Work

The project splits cleanly into three lanes that almost never touch each other.

## Lane 1 — Contracts (1 person)

- `JengaXP.sol`
- `JengaBadge.sol`
- `deploy.js`
- `hardhat.config.js`

This person works alone until deployment. Once the contracts are on Fuji and the addresses are in `.env`, their job is done and they shift to helping the frontend.

## Lane 2 — Hooks & Data (1 person)

- `useWallet.js`
- `useJengaXP.js`
- `constants.js`
- `App.jsx`

This person builds the connection between the contracts and the UI. They can start with dummy data before contracts are deployed.

## Lane 3 — UI Components (1–2 people)

All the components in `/components/` — each person takes specific files and owns them completely.

---

## Git Setup

No complex branching. For 12 hours, this is enough:

```
main       ← only stable, working code lives here
├── contracts   ← Lane 1 branch
├── hooks       ← Lane 2 branch
└── ui          ← Lane 3 branch
```

One person creates the repo, sets up the folder structure, and pushes it. Everyone else clones and works on their branch. That person does the merges.

**Merge into `main` at two checkpoints only:**

1. When contracts deploy
2. When frontend is functional

---

## The Dependency Chain

This is the critical path — things that must happen in order:

```
Contracts compile
      ↓
Contracts deploy to Fuji
      ↓
Addresses go into frontend/.env
      ↓
useJengaXP.js can be tested with real data
      ↓
Components can show real data
      ↓
End-to-end test
```

Lane 2 and Lane 3 can build with hardcoded dummy data before contracts deploy. The moment contracts hit Fuji, swap in the real addresses and test everything.
