import {useGovernorParams} from "../hooks/useGovernor";
import {short} from "../lib/format";
import type {VaultConfig} from "../lib/chain";

function hours(seconds: bigint): string {
  const h = Number(seconds) / 3600;
  if (h < 1) return `${Math.round(Number(seconds) / 60)}m`;
  return `${Math.round(h)}h`;
}

function pct(bps: bigint): string {
  return `${(Number(bps) / 100).toFixed(0)}%`;
}

export function GovernorPanel({config}: {config: VaultConfig}) {
  const p = useGovernorParams(config.governor);

  return (
    <div className="side-card">
      <div className="side-card-head">
        <span>Agents</span>
        <span className="pill">{p.agents.length}</span>
      </div>
      {p.isLoading ? (
        <p className="hint">Reading\u2026</p>
      ) : p.agents.length === 0 ? (
        <p className="hint">No agent registered on this fund yet.</p>
      ) : (
        <ul className="agent-list">
          {p.agents.map((a, i) => (
            <li key={a}>
              <span className="agent-avatar">A{i + 1}</span>
              <div>
                <div className="agent-name">Agent #{i + 1}</div>
                <code>{short(a)}</code>
              </div>
              <span className="dot on" title="Registered" />
            </li>
          ))}
        </ul>
      )}

      <div className="side-card-head" style={{marginTop: 28}}>
        <span>Governor</span>
      </div>
      <dl className="kv">
        <div>
          <dt>Contract</dt>
          <dd><code>{short(config.governor)}</code></dd>
        </div>
        <div>
          <dt>Voting window</dt>
          <dd>{p.isLoading ? "\u2026" : hours(p.vetoWindow)}</dd>
        </div>
        <div>
          <dt>Depositor veto</dt>
          <dd>{p.isLoading ? "\u2026" : pct(p.vetoThresholdBps)}</dd>
        </div>
        <div>
          <dt>Blocks to stop</dt>
          <dd>{p.isLoading ? "\u2026" : p.watcherBlockThreshold.toString()}</dd>
        </div>
        <div>
          <dt>Performance fee</dt>
          <dd>{p.isLoading ? "\u2026" : pct(p.performanceFeeBps)}</dd>
        </div>
      </dl>
    </div>
  );
}
