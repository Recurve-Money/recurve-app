# recurve-app

The Recurve dApp. Reads vault state from chain, handles deposits, redemptions,
and the redemption queue.

## Stack

Vite, React 18, TypeScript strict, wagmi 2, viem 2, RainbowKit 2.
Chain is Robinhood Chain (id 4663), defined locally since viem does not ship it.

## Running it

```bash
npm install
cp .env.example .env
npm run dev
```

## Before it does anything

Nothing is deployed. Until a registry and at least one vault exist, the app
renders a "no funds are live yet" state rather than a dashboard of zeros, since
a screen full of 0.00 reads as broken rather than unlaunched.

After running `script/Deploy.s.sol` in
[recurve-protocol](https://github.com/Recurve-Money/recurve-protocol), take the
three printed addresses and add the fund to `src/lib/chain.ts`:

```ts
export const vaults: VaultConfig[] = [
  {
    slug: "first",
    name: "First Fund",
    vault: "0x...",
    governor: "0x...",
    agent: "hermes-01",
  },
];
```

Set `VITE_REGISTRY` and `VITE_REVE` in `.env` from the same output.

## What is wired

| Action | Contract call |
|---|---|
| Deposit | `approve` if allowance is short, then `deposit`, then `delegate` |
| Redeem | `requestRedeem`, which clears instantly or returns a queue position |
| Claim | `claimRedeem` on a queued exit |
| Reads | `totalAssets`, `float`, `deployedAssets`, `totalSupply`, `convertToAssets` |
| Veto | `veto`, gated on `hasVetoed` and weight at the proposal snapshot |
| Stake | `approve` if short, then `stake` on the registry |
| Unstake | `requestUnstake`, then `unstake` once the delay elapses |
| Verdict | `castVerdict` with Approve or Block |

Deposits self-delegate. ERC20Votes weight is zero until delegated, so a
depositor who skips it holds shares that cannot veto anything and finds out
during a live proposal.

Reads go through one multicall per vault so every number on screen comes from
the same block.

## Proposals

Proposals live in a mapping, so there is no list to read. Ids come from
`ProposalPosted` logs and current state from a multicall over those ids.

That makes log retention load-bearing. Set `VITE_DEPLOY_BLOCK` to the block the
governor went up: scanning from genesis on a public endpoint times out before it
finds anything, and an RPC that prunes history returns a short list rather than
an error, which looks like "no proposals" instead of a failure.

## Errors

Contract reverts are mapped to plain sentences in `VaultPanel.tsx`.
`RequestNotReady` becomes "not claimable yet, the agent has to settle first"
rather than a stack of ABI decode noise. Unmapped reverts fall through to the
first line of the original message.

## WalletConnect

`VITE_WALLETCONNECT_ID` is optional. Without it the QR flow drops out and
injected wallets keep working, which degrades better than failing to boot.

## Deploy

```powershell
cd "D:\1проекты\recurve-app"; vercel --prod
```
