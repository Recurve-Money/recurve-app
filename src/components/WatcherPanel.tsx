import {useState} from "react";
import {useAccount, useReadContract, useReadContracts} from "wagmi";
import {maxUint256} from "viem";
import {erc20Abi, registryAbi} from "../lib/abi";
import {useTx} from "../hooks/useVault";
import {addresses} from "../lib/chain";
import {fmt, parseAmount} from "../lib/format";

enum Verdict {
  None = 0,
  Approve = 1,
  Block = 2,
}

export function WatcherPanel() {
  const {address, isConnected} = useAccount();
  const registry = addresses.registry as `0x${string}`;
  const reve = addresses.reve as `0x${string}`;
  const tx = useTx();

  const [amount, setAmount] = useState("");
  const [proposalId, setProposalId] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const {data, refetch} = useReadContracts({
    contracts: address
      ? [
          {address: registry, abi: registryAbi, functionName: "watchers", args: [address]},
          {address: registry, abi: registryAbi, functionName: "minStake"},
          {address: reve, abi: erc20Abi, functionName: "balanceOf", args: [address]},
          {address: reve, abi: erc20Abi, functionName: "allowance", args: [address, registry]},
        ]
      : [],
    query: {enabled: Boolean(address && registry && reve), refetchInterval: 15_000},
  });

  const g = data?.[0]?.result as readonly [bigint, bigint, bigint, boolean] | undefined;
  const stake = g?.[0] ?? 0n;
  const pendingUnstake = g?.[2] ?? 0n;
  const active = g?.[3] ?? false;
  const minStake = (data?.[1]?.result as bigint | undefined) ?? 0n;
  const balance = (data?.[2]?.result as bigint | undefined) ?? 0n;
  const allowance = (data?.[3]?.result as bigint | undefined) ?? 0n;

  const parsed = parseAmount(amount, 18);
  const needsApproval = parsed !== null && allowance < parsed;

  const validId = /^0x[0-9a-fA-F]{64}$/.test(proposalId.trim());

  async function run(fn: () => Promise<unknown>, ok: string) {
    setNote(null);
    try {
      await fn();
      setNote(ok);
      refetch();
    } catch (e) {
      setNote(e instanceof Error ? (e.message.split("\n")[0] ?? "Failed") : "Failed");
    }
  }

  if (!addresses.registry) {
    return <p className="sub">The watcher registry is not deployed yet.</p>;
  }

  return (
    <div className="watcher">
      <div className="stats">
        <Stat k="Your stake" v={fmt(stake)} />
        <Stat k="Minimum" v={fmt(minStake)} />
        <Stat k="Status" v={active ? "Active" : "Inactive"} />
        <Stat k="Wallet" v={fmt(balance)} />
      </div>

      {stake > 0n && stake < minStake && (
        <p className="warn">
          Stake is below the minimum, so verdicts will revert. Top up to become active again.
        </p>
      )}

      <div className="panel">
        <h3>Stake $REVE</h3>
        <div className="field">
          <input
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <span className="unit">REVE</span>
          <button className="max" onClick={() => setAmount(fmtRaw(balance))}>
            Max
          </button>
        </div>

        <button
          className="primary"
          disabled={!isConnected || parsed === null || parsed === 0n || tx.isPending}
          onClick={() =>
            run(async () => {
              if (needsApproval) {
                await tx.send({
                  address: reve,
                  abi: erc20Abi,
                  functionName: "approve",
                  args: [registry, maxUint256],
                });
                return;
              }
              await tx.send({
                address: registry,
                abi: registryAbi,
                functionName: "stake",
                args: [parsed!],
              });
            }, needsApproval ? "Approved. Submit again to stake." : "Staked.")
          }
        >
          {!isConnected
            ? "Connect wallet"
            : tx.isPending
              ? "Confirming\u2026"
              : needsApproval
                ? "Approve REVE"
                : "Stake"}
        </button>

        {stake > 0n && (
          <div className="unstake">
            {pendingUnstake > 0n ? (
              <>
                <p className="hint">
                  {fmt(pendingUnstake)} REVE pending. Stake stays slashable until it is
                  withdrawn.
                </p>
                <button
                  className="ghost-btn"
                  disabled={tx.isPending}
                  onClick={() =>
                    run(
                      () =>
                        tx.send({address: registry, abi: registryAbi, functionName: "unstake"}),
                      "Withdrawn.",
                    )
                  }
                >
                  Withdraw
                </button>
              </>
            ) : (
              <button
                className="ghost-btn"
                disabled={tx.isPending}
                onClick={() =>
                  run(
                    () =>
                      tx.send({
                        address: registry,
                        abi: registryAbi,
                        functionName: "requestUnstake",
                        args: [stake],
                      }),
                    "Unstake requested. The delay has to elapse first.",
                  )
                }
              >
                Request unstake
              </button>
            )}
          </div>
        )}
      </div>

      <div className="panel">
        <h3>Cast a verdict</h3>
        <p className="hint" style={{marginTop: 0, marginBottom: 14}}>
          Simulate the calldata before you do this. A verdict is final, and approving a call
          that drains a vault burns your whole stake.
        </p>

        <div className="field">
          <input
            placeholder="0x… proposal id"
            value={proposalId}
            onChange={(e) => setProposalId(e.target.value)}
            spellCheck={false}
          />
        </div>

        {proposalId.trim() !== "" && !validId && (
          <p className="warn">That is not a 32-byte proposal id.</p>
        )}

        <div className="verdict-row">
          <button
            className="block-btn"
            disabled={!active || !validId || tx.isPending}
            onClick={() =>
              run(
                () =>
                  tx.send({
                    address: registry,
                    abi: registryAbi,
                    functionName: "castVerdict",
                    args: [proposalId.trim() as `0x${string}`, Verdict.Block],
                  }),
                "Blocked.",
              )
            }
          >
            Block
          </button>
          <button
            className="approve-btn"
            disabled={!active || !validId || tx.isPending}
            onClick={() =>
              run(
                () =>
                  tx.send({
                    address: registry,
                    abi: registryAbi,
                    functionName: "castVerdict",
                    args: [proposalId.trim() as `0x${string}`, Verdict.Approve],
                  }),
                "Approved.",
              )
            }
          >
            Approve
          </button>
        </div>

        {!active && (
          <p className="hint">Stake at least {fmt(minStake)} REVE before casting verdicts.</p>
        )}
      </div>

      {note && <p className="note">{note}</p>}
    </div>
  );
}

function Stat({k, v}: {k: string; v: string}) {
  return (
    <div className="stat">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  );
}

function fmtRaw(v: bigint): string {
  const s = v.toString().padStart(19, "0");
  const whole = s.slice(0, s.length - 18);
  const frac = s.slice(s.length - 18).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

export {useReadContract};
