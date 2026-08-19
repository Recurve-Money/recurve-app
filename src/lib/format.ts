import {formatUnits} from "viem";

/** Compact token amount. Keeps enough precision to be useful, not enough to be noise. */
export function fmt(value: bigint, decimals = 18, maxFrac = 4): string {
  const raw = formatUnits(value, decimals);
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  if (n === 0) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return n.toLocaleString("en-US", {maximumFractionDigits: 2});
  if (n < 0.0001) return "<0.0001";
  return n.toLocaleString("en-US", {maximumFractionDigits: maxFrac});
}

export function pct(value: bigint, total: bigint, digits = 1): string {
  if (total === 0n) return "0%";
  return ((Number(value) / Number(total)) * 100).toFixed(digits) + "%";
}

export function short(addr?: string): string {
  if (!addr) return "";
  return addr.slice(0, 6) + "\u2026" + addr.slice(-4);
}

export function explorerAddr(addr: string): string {
  return `https://explorer.testnet.chain.robinhood.com/address/${addr}`;
}

/** Parses user input without throwing on the half-typed states a text field produces. */
export function parseAmount(input: string, decimals: number): bigint | null {
  const t = input.trim();
  if (!t || t === "." || !/^\d*\.?\d*$/.test(t)) return null;
  const [whole = "0", frac = ""] = t.split(".");
  if (frac.length > decimals) return null;
  try {
    return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt((frac || "0").padEnd(decimals, "0"));
  } catch {
    return null;
  }
}
