import {defineChain} from "viem";

/**
 * Robinhood Chain. Not in viem's chain list, so it is defined here.
 */
export const robinhood = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: {name: "Ether", symbol: "ETH", decimals: 18},
  rpcUrls: {
    default: {http: [import.meta.env.VITE_RPC_URL ?? "https://rpc.testnet.chain.robinhood.com"]},
  },
  blockExplorers: {
    default: {name: "Explorer", url: "https://explorer.testnet.chain.robinhood.com"},
  },
});

/**
 * Deployed addresses.
 *
 * Empty until the contracts go up. The app checks `isConfigured` and shows an
 * explicit "not deployed" state rather than rendering zeros, because a dashboard
 * full of 0.00 reads as a broken app instead of an unlaunched one.
 *
 * Fill these in after running script/Deploy.s.sol, or set them through the
 * VITE_ env vars so a preview deploy can point at a testnet.
 */
export const addresses = {
  registry: (import.meta.env.VITE_REGISTRY || "0x26ebF51c3D6967895F83b5C33664d99F1E42c97D") as `0x${string}` | "",
  /** $RECURVE, the token watchers stake. */
  reve: (import.meta.env.VITE_REVE || "0xf103C471DBCDE5C856559380432eFDC7e59Af9ec") as `0x${string}` | "",
} as const;

/**
 * Known vaults. Each is a vault plus the governor that owns it; the two are
 * deployed as a pair and are never mixed between funds.
 */
export interface VaultConfig {
  slug: string;
  name: string;
  ens?: string;
  vault: `0x${string}`;
  governor: `0x${string}`;
  agent?: string;
  description?: string;
}

export const vaults: VaultConfig[] = [
  {
    slug: "main",
    name: "Recurve Fund",
    vault: "0x235d0cE2Ca846495E9B9f18959A41f0625c0443D",
    governor: "0xe0e209799d57E6A95F72BdAe4b148cEf6f03da1a",
    description: "The first Recurve fund, on Robinhood Chain testnet.",
  },
];

/**
 * Block the contracts went up. Log scans start here.
 *
 * Scanning from genesis on a public RPC times out long before it finds a
 * proposal, and an endpoint that prunes history will quietly return a short
 * list rather than an error. Set this to the deploy block and the scan stays
 * cheap and complete.
 */
export const deployBlock: bigint = BigInt(import.meta.env.VITE_DEPLOY_BLOCK || "103992284");

/** recurve-api — the indexer. Used for history the chain itself cannot answer
 *  cheaply (a chart needs many past blocks; the RPC does not). */
export const apiUrl: string =
  import.meta.env.VITE_API_URL || "https://recurve-api-production.up.railway.app";

export const isConfigured = vaults.length > 0 && addresses.registry !== "";
