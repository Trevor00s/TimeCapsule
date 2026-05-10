# TimeCapsule

> Time-locked predictions, resolved by AI consensus, sealed forever on-chain.

A user writes a prediction (e.g. *"BTC closes above $200,000 on Dec 31, 2026"*),
sets an unlock date, and locks it on-chain. The capsule sits dormant until that
date. Then anyone can trigger resolution: a panel of independent AI validators
on GenLayer fetches the relevant evidence, deliberates, and writes a permanent
verdict (`TRUE` / `FALSE` / `UNRESOLVABLE`) onto the chain. Users accumulate a
public win/loss record over time.

## Stack

- **Smart contract**: Python on GenLayer (Studio)
- **Frontend**: Vite + React 19 + TanStack Start + TailwindCSS
- **Wallets**: Burner (auto-minted) and MetaMask
- **Chain**: GenLayer Studio

## Run locally

```bash
cp .env.example .env
# edit .env and set VITE_TIMECAPSULE_ADDRESS to your deployed contract
npm install
npm run dev
```

Open `http://localhost:8080`.

## Deploy the contract

1. Open https://studio.genlayer.com
2. Deploy `contracts/timecapsule.py`
3. Copy the deployed address into `.env`

## How it works

1. **Inscribe** a prediction in plain words.
2. **Seal** it on-chain with an unlock timestamp.
3. **Reveal**: when the hour strikes, anyone can summon the AI council.
   Validators fetch evidence from the resolution hint URL, deliberate via
   `eq_principle.prompt_comparative`, and write the verdict permanently.

The frontend uses a fast-path peek: it polls `gen_getTransactionByHash` and
extracts the leader's `eq_output` while the transaction is still committing,
so verdicts surface in seconds instead of minutes.

## License

MIT.
