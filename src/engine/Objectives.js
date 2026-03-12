// ─── REAL OBJECTIVES ──────────────────────────────────────
// Every objective maps to a measurable improvement in trading.
// No fake projects. No simulated funds. The wallet is the score.
//
// Tier gating: you must prove edge before unlocking power.

export const TIERS = {
  1: { name: "Survive", color: "#fe8019", unlockAt: 0 },
  2: { name: "Learn",   color: "#83a598", unlockAt: null }, // unlocked by completing T1 objectives
  3: { name: "Earn",    color: "#b8bb26", unlockAt: null },
  4: { name: "Scale",   color: "#d3869b", unlockAt: null },
};

export const OBJECTIVES = [
  // ── TIER 1: SURVIVE ────────────────────────────────
  {
    id: "survive_5",
    tier: 1,
    name: "5 trades, no DEAD_POOL",
    desc: "Go 5 consecutive trades without a honeypot wipeout",
    check: (s) => s.streak_no_dp >= 5,
    reward: "Unlocks filter research",
    unlocks: ["learn_20"],
  },
  {
    id: "break_even",
    tier: 1,
    name: "Break even",
    desc: "Total P&L >= $0. Stop the bleeding.",
    check: (s) => s.total_pnl >= 0,
    reward: "Unlocks position size tuning",
    unlocks: ["tune_size"],
  },
  {
    id: "wr_30",
    tier: 1,
    name: "Win rate > 30%",
    desc: "At least 30% of closed trades are profitable (min 5 trades)",
    check: (s) => s.total_trades >= 5 && s.win_rate >= 30,
    reward: "Unlocks exit analysis",
    unlocks: ["exit_analysis"],
  },
  {
    id: "first_winner",
    tier: 1,
    name: "First winner",
    desc: "Close a trade with positive P&L",
    check: (s) => s.wins >= 1,
    reward: "Proof it works",
  },
  {
    id: "survive_10",
    tier: 1,
    name: "10 trades completed",
    desc: "Enough data to start learning. Survive 10 trades.",
    check: (s) => s.total_trades >= 10,
    reward: "Unlocks Tier 2",
    unlocks_tier: 2,
  },

  // ── TIER 2: LEARN ──────────────────────────────────
  {
    id: "learn_20",
    tier: 2,
    name: "20 closed trades",
    desc: "Enough data for meaningful model retraining",
    check: (s) => s.total_trades >= 20,
    reward: "Unlocks neural retraining",
    unlocks: ["retrain_neural"],
  },
  {
    id: "exit_analysis",
    tier: 2,
    name: "Identify best exit pattern",
    desc: "Have trades exit via TAKE_PROFIT at least twice",
    check: (s) => s.take_profit_count >= 2,
    reward: "Exit timing data",
  },
  {
    id: "tune_size",
    tier: 2,
    name: "Prove $3 positions work",
    desc: "Positive P&L over 10 trades at $3 size",
    check: (s) => s.total_trades >= 10 && s.total_pnl > 0,
    reward: "Unlocks $5 positions",
    unlocks: ["size_5"],
  },
  {
    id: "retrain_neural",
    tier: 2,
    name: "Retrain neural scorer",
    desc: "Run retraining with 20+ trade outcomes. Action required.",
    check: (s) => s.neural_retrained && s.total_trades >= 20,
    reward: "Better entry predictions",
    action: "train_neural",
  },
  {
    id: "no_dp_10",
    tier: 2,
    name: "10 trades, no DEAD_POOL",
    desc: "Rug defense working — 10 consecutive clean trades",
    check: (s) => s.streak_no_dp >= 10,
    reward: "Unlocks Tier 3",
    unlocks_tier: 3,
  },

  // ── TIER 3: EARN ───────────────────────────────────
  {
    id: "size_5",
    tier: 3,
    name: "Scale to $5 positions",
    desc: "Proven edge allows larger size. Must maintain >30% WR.",
    check: (s) => s.win_rate >= 30 && s.total_pnl > 0 && s.total_trades >= 20,
    reward: "Override position size to $5",
    action: "scale_to_5",
  },
  {
    id: "pnl_positive_50",
    tier: 3,
    name: "Positive P&L over 50 trades",
    desc: "Consistent edge, not luck. 50 trades, P&L > $0.",
    check: (s) => s.total_trades >= 50 && s.total_pnl > 0,
    reward: "Proven systematic edge",
  },
  {
    id: "wr_40",
    tier: 3,
    name: "Win rate > 40%",
    desc: "Strong edge. 40%+ winners over 30+ trades.",
    check: (s) => s.total_trades >= 30 && s.win_rate >= 40,
    reward: "Unlocks multi-strategy",
  },
  {
    id: "wallet_2x",
    tier: 3,
    name: "Double wallet",
    desc: "Wallet balance reaches 2x starting amount",
    check: (s) => s.sol_balance >= s.starting_sol * 2,
    reward: "Unlocks Tier 4",
    unlocks_tier: 4,
  },

  // ── TIER 4: SCALE ──────────────────────────────────
  {
    id: "trades_200",
    tier: 4,
    name: "200 trades",
    desc: "Statistical significance. Real edge confirmed.",
    check: (s) => s.total_trades >= 200,
    reward: "Autonomous research loop",
  },
  {
    id: "self_improve",
    tier: 4,
    name: "Models self-improve",
    desc: "Neural scorer WR delta > 5% vs random after retraining",
    check: (s) => s.neural_wr_delta > 5,
    reward: "Proof of useful work",
  },
  {
    id: "wallet_5x",
    tier: 4,
    name: "5x wallet",
    desc: "Wallet reaches 5x starting balance",
    check: (s) => s.sol_balance >= s.starting_sol * 5,
    reward: "Ready to package for others",
  },
];

export function getUnlockedTiers(completedObjectives) {
  const tiers = new Set([1]); // tier 1 always unlocked
  for (const obj of OBJECTIVES) {
    if (completedObjectives.has(obj.id) && obj.unlocks_tier) {
      tiers.add(obj.unlocks_tier);
    }
  }
  return tiers;
}

export function getVisibleObjectives(completedObjectives) {
  const tiers = getUnlockedTiers(completedObjectives);
  return OBJECTIVES.filter((obj) => tiers.has(obj.tier));
}

export function checkObjectives(stats, completedObjectives) {
  const newlyCompleted = [];
  for (const obj of OBJECTIVES) {
    if (completedObjectives.has(obj.id)) continue;
    if (obj.check(stats)) {
      newlyCompleted.push(obj);
    }
  }
  return newlyCompleted;
}
