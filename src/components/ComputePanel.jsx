import { useState, useEffect, useCallback } from "react";
import { T } from "../styles/theme.js";
import { fmt } from "../engine/GameEngine.js";

const WORKER = "http://localhost:3001";

async function api(path, opts) {
  try {
    const r = await fetch(`${WORKER}${path}`, opts);
    return await r.json();
  } catch { return null; }
}

export function ComputePanel({ funds, onSpend, addLog }) {
  const [alive, setAlive] = useState(false);
  const [dash, setDash] = useState(null);
  const [jobs, setJobs] = useState({});
  const [commands, setCommands] = useState({});

  // Poll dashboard + jobs
  useEffect(() => {
    const poll = async () => {
      const h = await api("/health");
      setAlive(!!h);
      if (h) {
        const [d, j, c] = await Promise.all([
          api("/dashboard"),
          api("/jobs"),
          api("/commands"),
        ]);
        if (d) setDash(d);
        if (j) setJobs(j);
        if (c) setCommands(c);
      }
    };
    poll();
    const iv = setInterval(poll, 3000);
    return () => clearInterval(iv);
  }, []);

  const fire = useCallback(async (cmdKey) => {
    const cost = commands[cmdKey]?.cost || 0;
    if (cost > 0 && funds < cost) {
      if (addLog) addLog(`\u274C Not enough funds for ${cmdKey} ($${cost})`);
      return;
    }
    if (cost > 0 && onSpend) onSpend(cost);
    const result = await api("/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: cmdKey }),
    });
    if (result?.job_id) {
      if (addLog) addLog(`\u{1F525} ${commands[cmdKey]?.name || cmdKey} [${result.job_id}]`);
    } else {
      if (addLog) addLog(`\u274C ${cmdKey}: ${result?.error || "failed"}`);
    }
  }, [funds, commands, onSpend, addLog]);

  const runningJobs = Object.entries(jobs).filter(([, j]) => j.status === "running");
  const recentJobs = Object.entries(jobs)
    .filter(([, j]) => j.status !== "running")
    .sort(([, a], [, b]) => (b.finished || 0) - (a.finished || 0))
    .slice(0, 6);

  if (!alive) {
    return (
      <div>
        <WorkerStatus alive={false} />
        <div style={{
          background: "rgba(204,36,29,0.1)",
          border: `1px solid ${T.bg2}`,
          borderRadius: T.radius,
          padding: 12,
          color: T.fg4,
          fontSize: 11,
          fontFamily: T.mono,
          lineHeight: 1.8,
          marginTop: 8,
        }}>
          No worker. Start it:<br />
          <span style={{ color: T.bYellow }}>cd ~/agent-command-center</span><br />
          <span style={{ color: T.bYellow }}>python3 worker.py</span>
        </div>
      </div>
    );
  }

  const w = dash?.wallet || {};
  const tr = dash?.trades || {};
  const m = dash?.models || {};

  return (
    <div>
      <WorkerStatus alive={true} />

      {/* REAL WALLET */}
      <div style={{
        background: "linear-gradient(135deg, rgba(254,128,25,0.08) 0%, rgba(250,189,47,0.08) 100%)",
        border: `1px solid ${T.orange}`,
        borderRadius: T.radius,
        padding: "10px 12px",
        marginTop: 8,
        marginBottom: 10,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Label text="WALLET (ON-CHAIN)" />
          <span style={{ color: T.fg4, fontSize: 8, fontFamily: T.mono }}>
            {w.sol_price ? `SOL $${w.sol_price}` : ""}
          </span>
        </div>
        <div style={{
          color: T.bYellow,
          fontSize: 22,
          fontWeight: 700,
          fontFamily: T.mono,
          marginTop: 4,
        }}>
          {w.sol ? `${w.sol} SOL` : "..."}
        </div>
        <div style={{ color: T.fg4, fontSize: 11, fontFamily: T.mono }}>
          {w.usd ? `$${w.usd}` : ""}
        </div>
      </div>

      {/* REAL P&L */}
      <div style={{
        background: "rgba(0,0,0,0.3)",
        border: `1px solid ${T.bg2}`,
        borderRadius: T.radius,
        padding: "8px 12px",
        marginBottom: 10,
      }}>
        <Label text="TRADING P&L" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 4 }}>
          <Metric label="Total" value={`$${tr.total_pnl_usd ?? "?"}`}
            color={(tr.total_pnl_usd || 0) >= 0 ? T.bGreen : T.bRed} />
          <Metric label="Today" value={`$${tr.today_pnl_usd ?? "?"}`}
            color={(tr.today_pnl_usd || 0) >= 0 ? T.bGreen : T.bRed} />
          <Metric label="Win Rate" value={`${tr.win_rate ?? "?"}%`} color={T.bBlue} />
          <Metric label="Trades" value={tr.total_trades ?? "?"} color={T.fg3} />
          <Metric label="Dead Pool" value={tr.dead_pool ?? "?"} color={T.bRed} />
          <Metric label="Open" value={tr.open_positions?.length ?? 0} color={T.bAqua} />
        </div>
      </div>

      {/* MODEL STATUS */}
      <div style={{
        background: "rgba(0,0,0,0.3)",
        border: `1px solid ${T.bg2}`,
        borderRadius: T.radius,
        padding: "8px 12px",
        marginBottom: 10,
      }}>
        <Label text="MODELS" />
        <div style={{ marginTop: 4, fontSize: 10, fontFamily: T.mono, color: T.fg4, lineHeight: 1.6 }}>
          <div>Neural: {m.neural_scorer?.architecture || "?"} &middot; step {m.neural_scorer?.step ?? "?"} &middot; {m.neural_scorer?.samples ?? "?"} samples</div>
          <div>Brain: {m.unified_brain?.architecture || "?"}</div>
        </div>
      </div>

      {/* COMPUTE ACTIONS */}
      <Label text="COMPUTE" />
      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 4, marginBottom: 10 }}>
        <CmdBtn label="Retrain Neural" cost={2000} funds={funds} onClick={() => fire("train_neural")} />
        <CmdBtn label="Hyperparam Sweep" cost={3000} funds={funds} onClick={() => fire("train_neural_sweep")} />
        <CmdBtn label="Backtest Filters" cost={1000} funds={funds} onClick={() => fire("backtest_filters")} />
        <CmdBtn label="Auto-Retrain Pipeline" cost={5000} funds={funds} onClick={() => fire("auto_retrain")} />
        <CmdBtn label="Deploy Weights" cost={5000} funds={funds} onClick={() => fire("deploy_weights")} hot />
        <CmdBtn label="Empire Tests" cost={500} funds={funds} onClick={() => fire("test_empire")} />
      </div>

      {/* QUICK */}
      <Label text="FREE" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4, marginBottom: 10 }}>
        {["wallet", "trades", "models", "oversight", "services", "health_mlx", "sim_status"].map((k) => (
          <QuickBtn key={k} label={commands[k]?.name || k} onClick={() => fire(k)} />
        ))}
      </div>

      {/* RUNNING */}
      {runningJobs.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <Label text={`RUNNING (${runningJobs.length})`} />
          {runningJobs.map(([id, j]) => (
            <RunningJob key={id} id={id} job={j} />
          ))}
        </div>
      )}

      {/* RESULTS */}
      {recentJobs.length > 0 && (
        <div>
          <Label text="RESULTS" />
          {recentJobs.map(([id, j]) => (
            <JobResult key={id} id={id} job={j} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────

function WorkerStatus({ alive }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{
        width: 7, height: 7, borderRadius: "50%",
        background: alive ? "#b8bb26" : "#cc241d",
        boxShadow: `0 0 6px ${alive ? "#b8bb26" : "#cc241d"}`,
      }} />
      <span style={{ color: alive ? T.bGreen : T.bRed, fontSize: 10, fontFamily: T.mono }}>
        {alive ? "LIVE :3001" : "OFFLINE"}
      </span>
    </div>
  );
}

function Label({ text }) {
  return (
    <div style={{
      fontSize: 9, color: T.fg4, textTransform: "uppercase",
      letterSpacing: 1, fontWeight: 700,
    }}>
      {text}
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div>
      <div style={{ color, fontSize: 13, fontWeight: 700, fontFamily: T.mono }}>{value}</div>
      <div style={{ color: T.bg4, fontSize: 8, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function CmdBtn({ label, cost, funds, onClick, hot }) {
  const canAfford = funds >= cost;
  return (
    <button
      onClick={onClick}
      disabled={!canAfford}
      style={{
        background: hot
          ? (canAfford ? "rgba(251,73,52,0.12)" : "rgba(40,40,40,0.4)")
          : (canAfford ? "rgba(254,128,25,0.06)" : "rgba(40,40,40,0.4)"),
        border: `1px solid ${canAfford ? (hot ? T.bRed : T.orange) : T.bg2}`,
        borderRadius: T.radiusSm,
        padding: "5px 10px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        cursor: canAfford ? "pointer" : "not-allowed",
        opacity: canAfford ? 1 : 0.35,
        width: "100%", textAlign: "left",
      }}
    >
      <span style={{ color: T.fg1, fontSize: 11, fontFamily: T.display }}>{label}</span>
      <span style={{
        color: canAfford ? T.bYellow : T.bg4,
        fontSize: 10, fontFamily: T.mono, fontWeight: 700,
      }}>
        ${fmt(cost)}
      </span>
    </button>
  );
}

function QuickBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "rgba(60,56,54,0.5)",
      border: `1px solid ${T.bg2}`,
      borderRadius: 4,
      color: T.fg4, fontSize: 9, padding: "2px 6px",
      cursor: "pointer", fontFamily: T.mono,
    }}>
      {label}
    </button>
  );
}

function RunningJob({ id, job }) {
  const elapsed = Math.floor(Date.now() / 1000 - job.started);
  return (
    <div style={{
      background: "rgba(69,133,136,0.12)",
      border: `1px solid ${T.blue}`,
      borderRadius: T.radiusSm,
      padding: "4px 8px", marginTop: 2,
      display: "flex", justifyContent: "space-between",
      fontSize: 10, fontFamily: T.mono,
    }}>
      <span style={{ color: T.bBlue }}>{job.name}</span>
      <span style={{ color: T.bYellow }}>{elapsed}s</span>
    </div>
  );
}

function JobResult({ id, job }) {
  const [open, setOpen] = useState(false);
  const ok = job.status === "complete";
  const color = ok ? T.bGreen : job.status === "timeout" ? T.bYellow : T.bRed;
  const icon = ok ? "\u2713" : "\u2717";

  return (
    <div onClick={() => setOpen(!open)} style={{
      background: "rgba(0,0,0,0.25)",
      border: `1px solid ${T.bg2}`,
      borderRadius: T.radiusSm,
      padding: "3px 8px", marginTop: 2, cursor: "pointer",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 9, fontFamily: T.mono,
      }}>
        <span style={{ color }}>{icon} {job.name}</span>
        <span style={{ color: T.bg4 }}>{id}</span>
      </div>
      {open && job.output && (
        <pre style={{
          color: T.fg4, fontSize: 8, fontFamily: T.mono,
          marginTop: 3, whiteSpace: "pre-wrap", wordBreak: "break-all",
          maxHeight: 100, overflow: "auto",
          background: "rgba(0,0,0,0.3)", padding: 3, borderRadius: 2,
        }}>
          {job.output}
        </pre>
      )}
    </div>
  );
}
