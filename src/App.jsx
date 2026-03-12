import { useState, useEffect, useCallback, useRef } from "react";
import { T } from "./styles/theme.js";
import {
  freshLiveState, pollLiveData, fireCommand, saveLiveState, loadLiveState,
  fmt, OBJECTIVES, getUnlockedTiers, getVisibleObjectives,
} from "./engine/LiveEngine.js";
import { LogFeed } from "./components/LogFeed.jsx";

const POLL_MS = 5000;
const SAVE_MS = 30000;

export default function App() {
  const [s, setS] = useState(() => loadLiveState() || freshLiveState());
  const sRef = useRef(s);
  sRef.current = s;

  // Poll real data
  useEffect(() => {
    const poll = async () => {
      const next = await pollLiveData(sRef.current);
      setS(next);
    };
    poll();
    const iv = setInterval(poll, POLL_MS);
    return () => clearInterval(iv);
  }, []);

  // Auto-save
  useEffect(() => {
    const iv = setInterval(() => saveLiveState(sRef.current), SAVE_MS);
    return () => clearInterval(iv);
  }, []);

  const fire = useCallback(async (cmdKey) => {
    const result = await fireCommand(cmdKey);
    if (result?.job_id) {
      setS((prev) => ({
        ...prev,
        log: [...prev.log.slice(-80), {
          msg: `\u{1F525} ${cmdKey} fired [${result.job_id}]`,
          t: Date.now(),
        }],
      }));
    }
  }, []);

  const addLog = useCallback((msg) => {
    setS((prev) => ({
      ...prev,
      log: [...prev.log.slice(-80), { msg, t: Date.now() }],
    }));
  }, []);

  const tiers = getUnlockedTiers(s.completed);
  const visible = getVisibleObjectives(s.completed);
  const pnlColor = s.total_pnl >= 0 ? T.bGreen : T.bRed;
  const todayColor = s.today_pnl >= 0 ? T.bGreen : T.bRed;

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg0,
      color: T.fg1,
      fontFamily: "'Space Mono', 'IBM Plex Mono', monospace",
      padding: "16px",
      maxWidth: 1100,
      margin: "0 auto",
    }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=IBM+Plex+Mono:wght@400;600;700&display=swap"
        rel="stylesheet"
      />

      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T.fg1, margin: 0, letterSpacing: 2 }}>
          AGENT COMMAND CENTER
        </h1>
        <div style={{ fontSize: 10, color: T.bg4, marginTop: 2 }}>
          {s.workerAlive
            ? <span style={{ color: T.bGreen }}>LIVE</span>
            : <span style={{ color: T.bRed }}>OFFLINE — run python3 worker.py</span>
          }
        </div>
      </div>

      {/* WALLET — THE SCORE */}
      <div style={{
        background: "linear-gradient(135deg, rgba(254,128,25,0.06) 0%, rgba(250,189,47,0.06) 100%)",
        border: `1px solid ${T.orange}`,
        borderRadius: 10,
        padding: "14px 20px",
        marginBottom: 14,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div>
          <div style={{ color: T.fg4, fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>Wallet</div>
          <div style={{ color: T.bYellow, fontSize: 28, fontWeight: 700, fontFamily: T.mono }}>
            {s.sol_balance ? `${s.sol_balance} SOL` : "..."}
          </div>
          {s.sol_usd > 0 && <div style={{ color: T.fg4, fontSize: 12, fontFamily: T.mono }}>${s.sol_usd}</div>}
        </div>
        <Stat label="Total P&L" value={`$${s.total_pnl}`} color={pnlColor} />
        <Stat label="Today" value={`$${s.today_pnl}`} color={todayColor} />
        <Stat label="Win Rate" value={`${s.win_rate}%`} color={s.win_rate >= 30 ? T.bGreen : T.bRed} />
        <Stat label="Trades" value={s.total_trades} color={T.fg3} />
        <Stat label="Streak" value={`${s.streak_no_dp} clean`} color={s.streak_no_dp >= 5 ? T.bGreen : T.fg4} />
        <Stat label="Dead Pool" value={s.dead_pool} color={s.dead_pool > 0 ? T.bRed : T.bGreen} />
      </div>

      {/* MAIN: 3 columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

        {/* COL 1: OBJECTIVES */}
        <div>
          {[1, 2, 3, 4].map((tier) => {
            const unlocked = tiers.has(tier);
            const tierObjs = visible.filter((o) => o.tier === tier);
            if (!unlocked && tierObjs.length === 0) {
              return (
                <TierHeader key={tier} tier={tier} locked />
              );
            }
            return (
              <div key={tier} style={{ marginBottom: 12 }}>
                <TierHeader tier={tier} />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {tierObjs.map((obj) => (
                    <ObjectiveCard
                      key={obj.id}
                      obj={obj}
                      completed={s.completed.has(obj.id)}
                      onAction={obj.action ? () => fire(obj.action) : null}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* COL 2: OPEN POSITIONS + RECENT TRADES */}
        <div>
          <Label text="Open Positions" color={T.bBlue} />
          {s.open_positions.length === 0 ? (
            <div style={{ color: T.bg4, fontSize: 11, fontFamily: T.mono, padding: "8px 0" }}>
              No open positions. Scanning...
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 12 }}>
              {s.open_positions.map((p, i) => (
                <div key={i} style={{
                  background: "rgba(69,133,136,0.1)",
                  border: `1px solid ${T.blue}`,
                  borderRadius: T.radiusSm,
                  padding: "6px 10px",
                  fontFamily: T.mono,
                  fontSize: 11,
                  display: "flex",
                  justifyContent: "space-between",
                }}>
                  <span style={{ color: T.bBlue }}>{p.symbol}</span>
                  <span style={{ color: T.fg4 }}>${p.size_usd}</span>
                </div>
              ))}
            </div>
          )}

          <Label text="Recent Trades" color={T.fg4} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {s.recent_trades.map((t, i) => {
              const pnl = t.pnl_pct || 0;
              const won = pnl > 0;
              const dp = pnl <= -90;
              return (
                <div key={i} style={{
                  background: "rgba(0,0,0,0.25)",
                  borderRadius: T.radiusSm,
                  padding: "4px 8px",
                  fontFamily: T.mono,
                  fontSize: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  borderLeft: `2px solid ${dp ? T.bRed : won ? T.bGreen : T.bg4}`,
                }}>
                  <span style={{ color: won ? T.bGreen : T.fg4 }}>{t.symbol}</span>
                  <span style={{ color: dp ? T.bRed : won ? T.bGreen : T.fg4 }}>
                    {pnl > 0 ? "+" : ""}{pnl.toFixed(1)}%
                  </span>
                  <span style={{ color: T.bg4, fontSize: 9 }}>{t.exit_reason}</span>
                </div>
              );
            })}
          </div>

          {/* MODEL STATUS */}
          <div style={{ marginTop: 12 }}>
            <Label text="Models" color={T.bPurple} />
            <div style={{
              background: "rgba(0,0,0,0.2)",
              borderRadius: T.radiusSm,
              padding: "6px 10px",
              fontFamily: T.mono,
              fontSize: 10,
              color: T.fg4,
              lineHeight: 1.8,
            }}>
              <div>Neural: 5&rarr;8&rarr;1 &middot; step {s.neural_step} &middot; {s.neural_samples} samples</div>
              <div>Oversight: {s.conclusions} conclusions &middot; {s.settled} settled</div>
            </div>
          </div>
        </div>

        {/* COL 3: ACTIONS + LOG */}
        <div>
          <Label text="Actions" color={T.orange} />
          <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 12 }}>
            <ActionBtn label="Retrain Neural" desc="From v2.db closed trades" onClick={() => fire("train_neural")} />
            <ActionBtn label="Backtest Filters" desc="Winner vs loser analysis" onClick={() => fire("backtest_filters")} />
            <ActionBtn label="Auto-Retrain" desc="Full pipeline with regression gate" onClick={() => fire("auto_retrain")} />
            <ActionBtn label="Empire Tests" desc="Run test suite" onClick={() => fire("test_empire")} />
            <ActionBtn label="Deploy Weights" desc="Restart sniper with new weights" onClick={() => fire("deploy_weights")} hot />
          </div>

          <Label text="Quick" color={T.fg4} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 12 }}>
            {["wallet", "trades", "models", "oversight", "services", "sim_status"].map((k) => (
              <button key={k} onClick={() => fire(k)} style={{
                background: "rgba(60,56,54,0.5)",
                border: `1px solid ${T.bg2}`,
                borderRadius: 4,
                color: T.fg4, fontSize: 9, padding: "2px 6px",
                cursor: "pointer", fontFamily: T.mono,
              }}>
                {k}
              </button>
            ))}
          </div>

          <Label text="Feed" color={T.bAqua} />
          <LogFeed log={s.log} />
        </div>
      </div>

      {/* FOOTER */}
      <div style={{
        textAlign: "center", marginTop: 16,
        fontSize: 9, color: T.bg3, letterSpacing: 1,
      }}>
        THE WALLET IS THE SCORE
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ color: color || T.fg3, fontSize: 16, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
        {value}
      </div>
      <div style={{ color: T.bg4, fontSize: 8, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
    </div>
  );
}

function Label({ text, color }) {
  return (
    <div style={{
      fontSize: 10, color: color || T.fg4, textTransform: "uppercase",
      letterSpacing: 2, marginBottom: 6, fontWeight: 700,
    }}>
      {text}
    </div>
  );
}

function TierHeader({ tier, locked }) {
  const names = { 1: "Survive", 2: "Learn", 3: "Earn", 4: "Scale" };
  const colors = { 1: T.orange, 2: T.bBlue, 3: T.bGreen, 4: T.bPurple };
  return (
    <div style={{
      fontSize: 11, color: locked ? T.bg4 : colors[tier],
      textTransform: "uppercase", letterSpacing: 2,
      marginBottom: 6, fontWeight: 700,
      opacity: locked ? 0.3 : 1,
    }}>
      {locked ? "\u{1F512}" : ""} Tier {tier}: {names[tier]}
    </div>
  );
}

function ObjectiveCard({ obj, completed, onAction }) {
  const tierColors = { 1: T.orange, 2: T.bBlue, 3: T.bGreen, 4: T.bPurple };
  const accent = tierColors[obj.tier] || T.fg4;

  if (completed) {
    return (
      <div style={{
        background: "rgba(184,187,38,0.08)",
        border: `1px solid ${T.bg2}`,
        borderRadius: T.radiusSm,
        padding: "6px 10px",
        opacity: 0.6,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: T.bGreen, fontSize: 11 }}>{"\u2713"} {obj.name}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "rgba(0,0,0,0.25)",
      border: `1px solid ${accent}44`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: T.radiusSm,
      padding: "8px 10px",
    }}>
      <div style={{ color: T.fg1, fontSize: 12, fontWeight: 600 }}>{obj.name}</div>
      <div style={{ color: T.fg4, fontSize: 9, marginTop: 2 }}>{obj.desc}</div>
      <div style={{ color: accent, fontSize: 9, marginTop: 3, fontFamily: T.mono }}>
        {"\u2192"} {obj.reward}
      </div>
      {onAction && (
        <button onClick={onAction} style={{
          marginTop: 4,
          background: `${accent}22`,
          border: `1px solid ${accent}`,
          borderRadius: 4,
          color: accent,
          fontSize: 9,
          padding: "2px 8px",
          cursor: "pointer",
          fontFamily: T.mono,
        }}>
          Run
        </button>
      )}
    </div>
  );
}

function ActionBtn({ label, desc, onClick, hot }) {
  return (
    <button onClick={onClick} style={{
      background: hot ? "rgba(251,73,52,0.08)" : "rgba(254,128,25,0.05)",
      border: `1px solid ${hot ? T.bRed : T.orange}66`,
      borderRadius: T.radiusSm,
      padding: "6px 10px",
      textAlign: "left",
      cursor: "pointer",
      width: "100%",
    }}>
      <div style={{ color: T.fg1, fontSize: 11 }}>{label}</div>
      <div style={{ color: T.fg4, fontSize: 9 }}>{desc}</div>
    </button>
  );
}
