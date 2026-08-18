/**
 * Hand-trimmed ABIs — only the entrypoints the SDK calls.
 *
 * Shipping full Foundry artifacts would drag the bundle up for no benefit, and a
 * drift between these and the deployed contract surfaces as a decode error rather
 * than silently encoding the wrong calldata.
 */

export const vaultAbi = [
  {type: "function", name: "asset", inputs: [], outputs: [{type: "address"}], stateMutability: "view"},
  {type: "function", name: "totalAssets", inputs: [], outputs: [{type: "uint256"}], stateMutability: "view"},
  {type: "function", name: "totalSupply", inputs: [], outputs: [{type: "uint256"}], stateMutability: "view"},
  {type: "function", name: "float", inputs: [], outputs: [{type: "uint256"}], stateMutability: "view"},
  {type: "function", name: "deployedAssets", inputs: [], outputs: [{type: "uint256"}], stateMutability: "view"},
  {
    type: "function",
    name: "convertToAssets",
    inputs: [{name: "shares", type: "uint256"}],
    outputs: [{type: "uint256"}],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "previewRedeem",
    inputs: [{name: "shares", type: "uint256"}],
    outputs: [{type: "uint256"}],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{name: "account", type: "address"}],
    outputs: [{type: "uint256"}],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "deposit",
    inputs: [
      {name: "assets", type: "uint256"},
      {name: "receiver", type: "address"},
    ],
    outputs: [{type: "uint256"}],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "requestRedeem",
    inputs: [
      {name: "shares", type: "uint256"},
      {name: "receiver", type: "address"},
      {name: "owner", type: "address"},
    ],
    outputs: [{name: "requestId", type: "uint256"}],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimRedeem",
    inputs: [{name: "requestId", type: "uint256"}],
    outputs: [{name: "assets", type: "uint256"}],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "requestIdsOf",
    inputs: [{name: "owner", type: "address"}],
    outputs: [{type: "uint256[]"}],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "delegate",
    inputs: [{name: "delegatee", type: "address"}],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getPastVotes",
    inputs: [{name: "account", type: "address"}, {name: "timepoint", type: "uint256"}],
    outputs: [{type: "uint256"}],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPastTotalSupply",
    inputs: [{name: "timepoint", type: "uint256"}],
    outputs: [{type: "uint256"}],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "WithdrawalQueued",
    inputs: [
      {name: "owner", type: "address", indexed: true},
      {name: "requestId", type: "uint256", indexed: true},
      {name: "shares", type: "uint256", indexed: false},
    ],
  },
] as const;

export const governorAbi = [
  {
    type: "function",
    name: "propose",
    inputs: [
      {name: "target", type: "address"},
      {name: "assets", type: "uint256"},
      {name: "callData", type: "bytes"},
    ],
    outputs: [{name: "proposalId", type: "bytes32"}],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "veto",
    inputs: [{name: "proposalId", type: "bytes32"}],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "execute",
    inputs: [{name: "proposalId", type: "bytes32"}],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "settle",
    inputs: [
      {name: "proposalId", type: "bytes32"},
      {name: "returned", type: "uint256"},
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "proposals",
    inputs: [{type: "bytes32"}],
    outputs: [
      {name: "target", type: "address"},
      {name: "assets", type: "uint256"},
      {name: "callData", type: "bytes"},
      {name: "postedAt", type: "uint256"},
      {name: "snapshot", type: "uint256"},
      {name: "vetoWeight", type: "uint256"},
      {name: "state", type: "uint8"},
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "executableAt",
    inputs: [{name: "proposalId", type: "bytes32"}],
    outputs: [{type: "uint256"}],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "vetoWindow",
    inputs: [],
    outputs: [{type: "uint256"}],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasVetoed",
    inputs: [{type: "bytes32"}, {type: "address"}],
    outputs: [{type: "bool"}],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "vetoThresholdBps",
    inputs: [],
    outputs: [{type: "uint256"}],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "watcherBlockThreshold",
    inputs: [],
    outputs: [{type: "uint256"}],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "ProposalPosted",
    inputs: [
      {name: "proposalId", type: "bytes32", indexed: true},
      {name: "target", type: "address", indexed: true},
      {name: "assets", type: "uint256", indexed: false},
      {name: "executableAt", type: "uint256", indexed: false},
    ],
  },
] as const;

export const registryAbi = [
  {
    type: "function",
    name: "stake",
    inputs: [{name: "amount", type: "uint256"}],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "requestUnstake",
    inputs: [{name: "amount", type: "uint256"}],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {type: "function", name: "unstake", inputs: [], outputs: [], stateMutability: "nonpayable"},
  {
    type: "function",
    name: "castVerdict",
    inputs: [
      {name: "proposalId", type: "bytes32"},
      {name: "verdict", type: "uint8"},
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "watchers",
    inputs: [{type: "address"}],
    outputs: [
      {name: "stake", type: "uint256"},
      {name: "unstakeRequestedAt", type: "uint256"},
      {name: "pendingUnstake", type: "uint256"},
      {name: "active", type: "bool"},
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isActive",
    inputs: [{name: "watcher", type: "address"}],
    outputs: [{type: "bool"}],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "blockCount",
    inputs: [{name: "proposalId", type: "bytes32"}],
    outputs: [{type: "uint256"}],
    stateMutability: "view",
  },
  {type: "function", name: "minStake", inputs: [], outputs: [{type: "uint256"}], stateMutability: "view"},
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    inputs: [
      {name: "spender", type: "address"},
      {name: "amount", type: "uint256"},
    ],
    outputs: [{type: "bool"}],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      {name: "owner", type: "address"},
      {name: "spender", type: "address"},
    ],
    outputs: [{type: "uint256"}],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{name: "account", type: "address"}],
    outputs: [{type: "uint256"}],
    stateMutability: "view",
  },
  {type: "function", name: "decimals", inputs: [], outputs: [{type: "uint8"}], stateMutability: "view"},
  {type: "function", name: "symbol", inputs: [], outputs: [{type: "string"}], stateMutability: "view"},
] as const;
