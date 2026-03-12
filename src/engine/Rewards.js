// ─── REWARD LEDGER ────────────────────────────────────────
// Tracks rewards for both parties:
//   OPERATOR (human): directs strategy, earns from shipped projects
//   DEVICE (agents):  writes code, earns from output quality
//
// The game only works if both sides are rewarded.
// Operator reward = strategic decisions (what to build, what to ship)
// Device reward = execution quality (lines, bug rate, speed)
//
// Future: these map to real incentives.
// For now: they're the score.

export function createRewardLedger() {
  return {
    operator: {
      totalRevenue: 0,      // $ earned from shipped projects
      strategicScore: 0,    // bonus for good build order / timing
      projectsDirected: 0,  // projects initiated by operator
      prestigeResets: 0,    // times pivoted
    },
    device: {
      totalLines: 0,        // lines of code produced
      totalBugsFixed: 0,    // bugs caught and fixed
      qualityScore: 0,      // rolling quality average
      uptime: 0,            // ticks active
    },
  };
}

export function recordProjectShipped(ledger, reward) {
  ledger.operator.totalRevenue += reward;
  ledger.operator.projectsDirected += 1;
}

export function recordAgentOutput(ledger, lines, bugs, quality) {
  ledger.device.totalLines += lines;
  ledger.device.totalBugsFixed += bugs;
  // Exponential moving average for quality
  ledger.device.qualityScore = ledger.device.qualityScore * 0.95 + quality * 0.05;
}

export function recordTick(ledger) {
  ledger.device.uptime += 1;
}

export function recordPrestige(ledger) {
  ledger.operator.prestigeResets += 1;
}

// Combined score: how well is the human-agent team performing?
export function teamScore(ledger) {
  const opScore = ledger.operator.totalRevenue * 0.001 + ledger.operator.strategicScore;
  const devScore = ledger.device.totalLines * 0.0001 + ledger.device.qualityScore * 100;
  return Math.floor(opScore + devScore);
}
