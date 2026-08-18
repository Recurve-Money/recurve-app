import {useState} from "react";
import {useAccount} from "wagmi";
import {maxUint256} from "viem";
import {erc20Abi, vaultAbi} from "../lib/abi";
import {useAllowance, useBalance, usePosition, useTx, useVault} from "../hooks/useVault";
import {fmt, parseAmount} from "../lib/format";
import type {VaultConfig} from "../lib/chain";

type Mode = "deposit" | "redeem";

export function VaultPanel({config}: {config: VaultConfig}) {
  const {isConnected} = useAccount();
  const v = useVault(config.vault);
  const position = usePosition(config.vault);
  const balance = useBalance(v.asset);
  const allowance = useAllowance(v.asset, config.vault);
  const tx = useTx();

  const [mode, setMode] = useState<Mode>("deposit");
  const [input, setInput] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const amount = parseAmount(input, mode === "deposit" ? v.decimals : 18);
  const needsApproval =
    mode === "deposit" && amount !== null && (allowance.data ?? 0n) < amount;

  const max = mode === "deposit" ? (balance.data ?? 0n) : position.shares;
  const overMax = amount !== null && amount > max;

  async function submit() {
    if (amount === null || amount === 0n) return;
    setNote(null);

    try {
      if (mode === "deposit") {
        if (needsApproval) {
          await tx.send({
            address: v.asset!,
            abi: erc20Abi,
            functionName: "approve",
            args: [config.vault, maxUint256],
          });
          await allowance.refetch();
          setNote("Approved. Submit again to deposit.");
          return;
        }

        await tx.send({
          address: config.vault,
          abi: vaultAbi,
          functionName: "deposit",
          args: [amount, addressOf()],
        });

        // Voting weight is zero until delegated. A depositor who skips this holds
        // shares that cannot veto anything, and only discovers it mid-proposal.
        await tx.send({
          address: config.vault,
          abi: vaultAbi,
          functionName: "delegate",
          args: [addressOf()],
        });

        setNote("Deposited and delegated.");
      } else {
        await tx.send({
          address: config.vault,
          abi: vaultAbi,
          functionName: "requestRedeem",
          args: [amount, addressOf(), addressOf()],
        });
        setNote(
          amount <= v.float
            ? "Redeemed."
            : "Queued. It settles at the realized price once the agent unwinds.",
        );
      }

      setInput("");
      position.refetch();
    } catch (e) {
      setNote(readableError(e));
    }
  }

  const {address} = useAccount();
  function addressOf() {
    return address!;
  }

  const wouldQueue =
    mode === "redeem" && amount !== null && amount > 0n && amount > sharesWorth(v.float, v.sharePrice);

  return (
    <div className="panel">
      <div className="tabs">
        <button className={mode === "deposit" ? "on" : ""} onClick={() => setMode("deposit")}>
          Deposit
        </button>
        <button className={mode === "redeem" ? "on" : ""} onClick={() => setMode("redeem")}>
          Redeem
        </button>
      </div>

      <div className="field">
        <input
          inputMode="decimal"
          placeholder="0.0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <span className="unit">{mode === "deposit" ? v.symbol : "shares"}</span>
        <button className="max" onClick={() => setInput(fmtRaw(max, mode === "deposit" ? v.decimals : 18))}>
          Max
        </button>
      </div>

      <p className="hint">
        {mode === "deposit"
          ? `Balance ${fmt(balance.data ?? 0n, v.decimals)} ${v.symbol}`
          : `Shares ${fmt(position.shares)}`}
      </p>

      {wouldQueue && (
        <p className="warn">
          The float does not cover this. The exit will queue and settle at the realized price.
        </p>
      )}

      {overMax && <p className="warn">More than you hold.</p>}

      <button
        className="primary"
        disabled={!isConnected || amount === null || amount === 0n || overMax || tx.isPending}
        onClick={submit}
      >
        {!isConnected
          ? "Connect wallet"
          : tx.isPending
            ? "Confirming\u2026"
            : needsApproval
              ? `Approve ${v.symbol}`
              : mode === "deposit"
                ? "Deposit"
                : "Redeem"}
      </button>

      {note && <p className="note">{note}</p>}

      {position.requestIds.length > 0 && (
        <div className="queue">
          <h4>Queued exits</h4>
          {position.requestIds.map((id) => (
            <QueuedRow key={id.toString()} vault={config.vault} id={id} onDone={position.refetch} />
          ))}
        </div>
      )}
    </div>
  );
}

function QueuedRow({
  vault,
  id,
  onDone,
}: {
  vault: `0x${string}`;
  id: bigint;
  onDone: () => void;
}) {
  const tx = useTx();
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="queue-row">
      <span>Request #{id.toString()}</span>
      <button
        disabled={tx.isPending}
        onClick={async () => {
          setErr(null);
          try {
            await tx.send({address: vault, abi: vaultAbi, functionName: "claimRedeem", args: [id]});
            onDone();
          } catch (e) {
            setErr(readableError(e));
          }
        }}
      >
        {tx.isPending ? "\u2026" : "Claim"}
      </button>
      {err && <span className="row-err">{err}</span>}
    </div>
  );
}

function sharesWorth(assets: bigint, sharePrice: bigint): bigint {
  if (sharePrice === 0n) return 0n;
  return (assets * 10n ** 18n) / sharePrice;
}

function fmtRaw(v: bigint, decimals: number): string {
  const s = v.toString().padStart(decimals + 1, "0");
  const whole = s.slice(0, s.length - decimals);
  const frac = s.slice(s.length - decimals).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

/**
 * Contract reverts arrive wrapped in several layers of viem context. Pull the
 * custom error name out when it is there, since "RequestNotReady" tells a user
 * far more than a stack of ABI decode noise.
 */
function readableError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);

  const known: Record<string, string> = {
    FloatTooLow: "The vault cannot release that much right now.",
    RequestNotReady: "Not claimable yet. The agent has to settle first.",
    RequestAlreadyClaimed: "Already claimed.",
    NotRequestOwner: "That request belongs to another address.",
    VetoWindowOpen: "Still inside the veto window.",
    VetoWindowClosed: "The veto window has closed.",
    NoVotingWeight: "No voting weight at the snapshot. Delegate before the next proposal.",
    AlreadyVetoed: "You already voted on this one.",
    WatchersBlocked: "Watchers blocked this proposal.",
    BelowMinStake: "Stake is under the minimum.",
    AlreadyVoted: "Verdict already cast. They are final.",
  };

  for (const [name, text] of Object.entries(known)) {
    if (msg.includes(name)) return text;
  }
  if (msg.includes("User rejected") || msg.includes("rejected the request")) return "Cancelled.";
  if (msg.includes("insufficient funds")) return "Not enough gas.";
  return msg.split("\n")[0] ?? "Transaction failed.";
}
