import {ConnectButton} from "@rainbow-me/rainbowkit";
import {useState} from "react";
import {isConfigured, vaults, type VaultConfig} from "./lib/chain";
import {useVault} from "./hooks/useVault";
import {fmt} from "./lib/format";
import {VaultPanel} from "./components/VaultPanel";
import {Proposals} from "./components/Proposals";
import {WatcherPanel} from "./components/WatcherPanel";

const MARK = (
  <svg viewBox="0 0 612 759" fill="currentColor" aria-hidden="true" className="mark">
    <path d="M553 5.6a869 869 0 0 0-73 7.4 1118 1118 0 0 0-69.5 12.6c-111.8 25.6-185.8 56.6-250 104.5a409 409 0 0 0-64.2 59.4l-11.4 14c-40.7 50-78.3 143-80.2 198-.3 9.2.7 8.5 11-7.1 28.1-42.5 53.5-72 86.3-100.5 78.9-68.4 212.1-120.4 323.9-126.5 12.3-.7 12.3-.7 17.6-5.3 7.5-6.6 47.1-43.9 66-62.1 21.4-20.7 68.7-64.8 85.8-80 8.8-7.8 13.7-12.9 13.5-13.9-.4-2.1-26.9-2.4-55.8-.5m-77 245.1c-56.8 2.6-115.6 11.2-152.5 22.2L310 277C164.8 320.5 74.7 407 33.6 542.5A422 422 0 0 0 18 605c-5.4 28.7-6.1 37.7-2.7 33.7a43 43 0 0 0 4.7-8.5c3.6-9.2 18.3-36.9 24.6-46.8 7.6-11.8 16.6-25 20.1-29.4 15.4-19.4 21.1-26 37.2-42.1a335 335 0 0 1 44-38.4l12.2-8.5c27.4-19 102.9-51.2 119.7-51 .8 0 4.6-.9 8.5-1.9 9.8-2.6 22.9-4.8 37.1-6.3 11.9-1.2 11.9-1.2 18.3-6.7a1502 1502 0 0 1 64.7-62.1l31.9-29.5c16.4-15.1 24.7-22.7 45-40.6 19.3-17.2 19.2-17.5-7.3-16.2M275.5 495.6c-39.3 12.1-62.9 24.1-88.7 45.2-19.2 15.6-19.5 16.8-9 32.3 48.9 72.4 138.5 143.3 215.2 170.4 5.8 2.1 15.1 5.7 20.7 8.1 19.5 8.3 19.8 5.4 1.4-10.1a416 416 0 0 1-57.1-57.9 300 300 0 0 1-30.7-41.6l-7.8-13c-18.7-31.3-32.7-82.1-31.1-113.4 1.3-24.7 1.5-22.1-1.9-22.3-1.6-.1-6.6.9-11 2.3" />
  </svg>
);

type Tab = "funds" | "watcher";

export default function App() {
  const [tab, setTab] = useState<Tab>("funds");
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const open = vaults.find((v) => v.slug === openSlug) ?? null;

  return (
    <div className="app">
      <header className="hdr">
        <div className="hdr-left">
          <a className="brand" href="https://recurvemoney.xyz">
            {MARK}
            <span>Recurve</span>
          </a>
          <nav>
            <button
              className={tab === "funds" ? "on" : ""}
              onClick={() => {
                setTab("funds");
                setOpenSlug(null);
              }}
            >
              Funds
            </button>
            <button className={tab === "watcher" ? "on" : ""} onClick={() => setTab("watcher")}>
              Watcher
            </button>
            <a href="https://docs.recurvemoney.xyz">Docs</a>
          </nav>
        </div>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </header>

      <main>
        {!isConfigured ? (
          <NotDeployed />
        ) : tab === "watcher" ? (
          <section>
            <h1>Watcher</h1>
            <p className="sub">
              Stake $REVE, replay proposed calldata, and rule on it. Blocking something harmless
              costs one round's reward. Approving a drain costs the whole stake.
            </p>
            <WatcherPanel />
          </section>
        ) : open ? (
          <VaultDetail config={open} onBack={() => setOpenSlug(null)} />
        ) : (
          <Explore onOpen={setOpenSlug} />
        )}
      </main>

      <footer>
        <span>Recurve</span>
        <span className="muted">Unaudited. Nothing is deployed to mainnet.</span>
      </footer>
    </div>
  );
}

function NotDeployed() {
  return (
    <section className="empty">
      <h1>No funds are live yet.</h1>
      <p>
        The contracts are written and tested but not deployed. Once a registry and the first
        vault go up, add their addresses to <code>src/lib/chain.ts</code> and this page reads
        them straight off chain.
      </p>
      <div className="empty-actions">
        <a className="primary" href="https://docs.recurvemoney.xyz">Read the docs</a>
        <a className="ghost" href="https://github.com/Recurve-Money/recurve-protocol">Contracts</a>
      </div>
    </section>
  );
}

function Explore({onOpen}: {onOpen: (slug: string) => void}) {
  return (
    <section id="explore">
      <h1>Funds</h1>
      <p className="sub">
        Every fund is a non-custodial vault with an agent in the operator seat. Numbers below
        are read from chain.
      </p>
      <div className="grid">
        {vaults.map((v) => (
          <VaultCard key={v.slug} config={v} onOpen={() => onOpen(v.slug)} />
        ))}
      </div>
    </section>
  );
}

function VaultCard({config, onOpen}: {config: VaultConfig; onOpen: () => void}) {
  const v = useVault(config.vault);

  return (
    <button className="card" onClick={onOpen}>
      <div className="card-top">
        <span className="card-name">{config.name}</span>
        {v.isError && <span className="pill err">unreachable</span>}
      </div>
      {config.ens && <span className="ens">{config.ens}</span>}
      <dl>
        <div><dt>TVL</dt><dd>{v.isLoading ? "\u2026" : `${fmt(v.totalAssets, v.decimals)} ${v.symbol}`}</dd></div>
        <div><dt>Float</dt><dd>{v.isLoading ? "\u2026" : fmt(v.float, v.decimals)}</dd></div>
        <div><dt>Deployed</dt><dd>{v.isLoading ? "\u2026" : fmt(v.deployed, v.decimals)}</dd></div>
        <div><dt>Share price</dt><dd>{v.isLoading ? "\u2026" : fmt(v.sharePrice)}</dd></div>
      </dl>
    </button>
  );
}

function VaultDetail({config, onBack}: {config: VaultConfig; onBack: () => void}) {
  const v = useVault(config.vault);

  return (
    <section className="detail">
      <button className="back" onClick={onBack}>Back</button>
      <h1>{config.name}</h1>
      {config.ens && <p className="ens">{config.ens}</p>}
      {config.description && <p className="sub">{config.description}</p>}

      <div className="stats">
        <Stat k="TVL" v={`${fmt(v.totalAssets, v.decimals)} ${v.symbol}`} />
        <Stat k="Float" v={fmt(v.float, v.decimals)} />
        <Stat k="Deployed" v={fmt(v.deployed, v.decimals)} />
        <Stat k="Share price" v={fmt(v.sharePrice)} />
      </div>

      <div className="detail-cols">
        <VaultPanel config={config} />
        <div className="detail-props">
          <h2>Proposals</h2>
          <Proposals config={config} />
        </div>
      </div>
    </section>
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
