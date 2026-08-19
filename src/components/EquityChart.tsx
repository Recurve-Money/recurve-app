import {useEffect, useState} from "react";
import {apiUrl} from "../lib/chain";

interface Point {
  t: string;
  total_assets: string | null;
  share_price: string | null;
}

/**
 * Plain SVG, no chart library. The bundle already carries wagmi + RainbowKit;
 * a line and a dashed baseline do not need another dependency for it.
 */
export function EquityChart({slug, decimals}: {slug: string; decimals: number}) {
  const [points, setPoints] = useState<Point[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    setPoints(null);
    setFailed(false);
    fetch(`${apiUrl}/funds/${slug}/history?range=7d`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => {
        if (live) setPoints(d.points ?? []);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [slug]);

  if (failed) return <p className="hint">Could not reach the indexer for history.</p>;
  if (!points) return <div className="chart-empty">Loading\u2026</div>;

  const values = points
    .map((p) => (p.total_assets ? Number(p.total_assets) / 10 ** decimals : null))
    .filter((v): v is number => v !== null);

  if (values.length < 2) {
    return <div className="chart-empty">Not enough history yet. Check back after a deposit or two.</div>;
  }

  const W = 760;
  const H = 220;
  const PAD = 8;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, min + 1e-9);
  const span = max - min || 1;

  const coords = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (W - PAD * 2) + PAD;
    const y = H - PAD - ((v - min) / span) * (H - PAD * 2);
    return [x, y] as const;
  });

  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1]![0].toFixed(1)} ${H} L${coords[0]![0].toFixed(1)} ${H} Z`;
  const last = values[values.length - 1]!;
  const first = values[0]!;
  const up = last >= first;

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-label="TVL over the last 7 days">
      <defs>
        <linearGradient id={`fade-${slug}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up ? "var(--mint)" : "var(--err)"} stopOpacity=".16" />
          <stop offset="100%" stopColor={up ? "var(--mint)" : "var(--err)"} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#fade-${slug})`} stroke="none" />
      <path d={line} fill="none" stroke={up ? "var(--mint)" : "var(--err)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
