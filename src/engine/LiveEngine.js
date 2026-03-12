// ─── LIVE ENGINE ──────────────────────────────────────────
// No simulation. All data from real trading infrastructure.
// The wallet is the score. The objectives are real.

import { OBJECTIVES, getUnlockedTiers, getVisibleObjectives, checkObjectives } from "./Objectives.js";

const WORKER = "http://localhost:3001";

async function api(path, opts) {
  try {
    const r = await fetch(`${WORKER}${path}`, opts);
    return await r.json();
  } catch { return null; }
}

// ─── LIVE STATE ──────────────────────────────────────────
// Polled from worker, not simulated

export function freshLiveState() {
  return {
    // Worker connection
    workerAlive: false,
    lastPoll: 0,

    // Wallet (on-chain)
    sol_balance: 0,
    sol_usd: 0,
    sol_price: 0,
    starting_sol: 0.6, // initial deposit

    // Trading (from v2.db)
    total_pnl: 0,
    today_pnl: 0,
    total_trades: 0,
    wins: 0,
    win_rate: 0,
    dead_pool: 0,
    open_positions: [],
    recent_trades: [],

    // Derived streaks (computed from trade history)
    streak_no_dp: 0,
    take_profit_count: 0,

    // Models
    neural_step: 0,
    neural_samples: 0,
    neural_retrained: false,
    neural_wr_delta: 0,

    // Oversight
    conclusions: 0,
    settled: 0,

    // Objectives
    completed: new Set(),
    log: [{ msg: "Command Center online. Wallet is the score.", t: Date.now() }],

    // Persistence
    savedAt: null,
  };
}

// ─── POLL REAL DATA ──────────────────────────────────────

export async function pollLiveData(state) {
  const dash = await api("/dashboard");
  if (!dash) {
    return { ...state, workerAlive: false, lastPoll: Date.now() };
  }

  const w = dash.wallet || {};
  const tr = dash.trades || {};
  const m = dash.models || {};
  const o = dash.oversight || {};

  // Compute streaks from recent trades
  let streak = 0;
  let tpCount = 0;
  const recent = tr.recent_trades || [];
  for (const t of recent) {
    if (t.exit_reason === "TAKE_PROFIT") tpCount++;
  }
  // Count streak from most recent backward
  for (const t of recent) {
    const pnl = t.pnl_pct || 0;
    if (pnl <= -90) break; // DEAD_POOL breaks streak
    streak++;
  }

  const next = {
    ...state,
    workerAlive: true,
    lastPoll: Date.now(),
    sol_balance: w.sol || 0,
    sol_usd: w.usd || 0,
    sol_price: w.sol_price || 0,
    total_pnl: tr.total_pnl_usd || 0,
    today_pnl: tr.today_pnl_usd || 0,
    total_trades: tr.total_trades || 0,
    wins: tr.wins || 0,
    win_rate: tr.win_rate || 0,
    dead_pool: tr.dead_pool || 0,
    open_positions: tr.open_positions || [],
    recent_trades: recent,
    streak_no_dp: streak,
    take_profit_count: tpCount,
    neural_step: m.neural_scorer?.step || 0,
    neural_samples: m.neural_scorer?.samples || 0,
    conclusions: o.conclusions || 0,
    settled: o.settled || 0,
  };

  // Check objectives
  const newlyCompleted = checkObjectives(next, next.completed);
  const newLogs = [];
  for (const obj of newlyCompleted) {
    next.completed.add(obj.id);
    newLogs.push({
      msg: `\u{1F3AF} OBJECTIVE: ${obj.name} \u2014 ${obj.reward}`,
      t: Date.now(),
    });
  }

  if (newLogs.length > 0) {
    next.log = [...next.log.slice(-80), ...newLogs];
  }

  return next;
}

// ─── FIRE COMMANDS ───────────────────────────────────────

export async function fireCommand(cmdKey) {
  return await api("/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command: cmdKey }),
  });
}

// ─── SAVE / LOAD ─────────────────────────────────────────
const SAVE_KEY = "acc_live_v2";

export function saveLiveState(state) {
  try {
    const toSave = {
      ...state,
      completed: [...state.completed],
      savedAt: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
  } catch {}
}

export function loadLiveState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    saved.completed = new Set(saved.completed || []);
    return saved;
  } catch {
    return null;
  }
}

// ─── HELPERS ─────────────────────────────────────────────
export function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return typeof n === "number" ? (Number.isInteger(n) ? n.toString() : n.toFixed(2)) : String(n);
}

export { OBJECTIVES, getUnlockedTiers, getVisibleObjectives };
