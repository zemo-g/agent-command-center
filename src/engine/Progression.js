// ─── PRESTIGE + PROGRESSION ───────────────────────────────
// Egg Inc model: earn enough, "pivot" your company, restart with permanent bonus.
// Each prestige level = +50% all output. Compounds.
// The hook: prestige 3+ unlocks new building tiers and project types.

export const PRESTIGE_THRESHOLDS = [
  50_000,      // Prestige 1: seed round
  500_000,     // Prestige 2: series A
  5_000_000,   // Prestige 3: series B
  50_000_000,  // Prestige 4: series C
  500_000_000, // Prestige 5: IPO
];

export function canPrestige(totalEarned, prestigeLevel) {
  const threshold = PRESTIGE_THRESHOLDS[prestigeLevel] || PRESTIGE_THRESHOLDS[PRESTIGE_THRESHOLDS.length - 1] * 10;
  return totalEarned >= threshold;
}

export function prestigeThreshold(prestigeLevel) {
  return PRESTIGE_THRESHOLDS[prestigeLevel] || PRESTIGE_THRESHOLDS[PRESTIGE_THRESHOLDS.length - 1] * 10;
}

export function prestigeBonus(prestigeLevel) {
  return 1 + prestigeLevel * 0.5;
}

// ─── MILESTONES ───────────────────────────────────────────
// One-time unlocks that mark progression and give bonuses
export const MILESTONES = [
  { id: "first_ship",   name: "First Ship",         check: (s) => s.projectsShipped >= 1,   reward: 200,   msg: "First project shipped!" },
  { id: "ten_agents",   name: "Full Squad",          check: (s) => s.agents >= 10,           reward: 500,   msg: "10 agents assembled." },
  { id: "ten_ships",    name: "Serial Shipper",      check: (s) => s.projectsShipped >= 10,  reward: 2000,  msg: "10 projects shipped." },
  { id: "100k_lines",   name: "100K Club",           check: (s) => s.linesWritten >= 100000, reward: 5000,  msg: "100K lines of code written." },
  { id: "fifty_agents", name: "Army",                check: (s) => s.agents >= 50,           reward: 10000, msg: "50 agents. You command an army." },
  { id: "1m_lines",     name: "Megacoder",           check: (s) => s.linesWritten >= 1e6,    reward: 50000, msg: "1M lines. Legend status." },
  { id: "fifty_ships",  name: "Factory",             check: (s) => s.projectsShipped >= 50,  reward: 25000, msg: "50 projects. You're a factory." },
];
