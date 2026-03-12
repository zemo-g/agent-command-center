// ─── PROJECT CONTRACTS ────────────────────────────────────
// Egg Inc progression: each tier is a 2-3x jump in scope.
// Projects are the ONLY revenue source. No idle income without work.

export const PROJECTS = [
  // Tier 1: Startup grind
  { id: "cli",       name: "CLI Tool",        difficulty: 1, reward: 100,     lines: 200,     minAgents: 1,  tier: 1 },
  { id: "script",    name: "Build Script",    difficulty: 1, reward: 150,     lines: 350,     minAgents: 1,  tier: 1 },
  { id: "bot",       name: "Discord Bot",     difficulty: 1, reward: 220,     lines: 500,     minAgents: 1,  tier: 1 },

  // Tier 2: Growing
  { id: "api",       name: "REST API",        difficulty: 2, reward: 400,     lines: 1200,    minAgents: 2,  tier: 2 },
  { id: "dashboard", name: "Dashboard",       difficulty: 2, reward: 600,     lines: 2000,    minAgents: 3,  tier: 2 },
  { id: "mobile",    name: "Mobile App",      difficulty: 3, reward: 1000,    lines: 3500,    minAgents: 4,  tier: 2 },

  // Tier 3: Scaling
  { id: "pipeline",  name: "ML Pipeline",     difficulty: 4, reward: 2500,    lines: 8000,    minAgents: 6,  tier: 3 },
  { id: "platform",  name: "Full Platform",   difficulty: 5, reward: 6000,    lines: 18000,   minAgents: 10, tier: 3 },
  { id: "infra",     name: "Cloud Infra",     difficulty: 5, reward: 8000,    lines: 25000,   minAgents: 12, tier: 3 },

  // Tier 4: Enterprise
  { id: "kernel",    name: "OS Kernel",       difficulty: 7, reward: 25000,   lines: 60000,   minAgents: 20, tier: 4 },
  { id: "compiler",  name: "Compiler",        difficulty: 8, reward: 50000,   lines: 100000,  minAgents: 30, tier: 4 },
  { id: "ai",        name: "AI System",       difficulty: 9, reward: 120000,  lines: 250000,  minAgents: 50, tier: 4 },

  // Tier 5: Moonshots (prestige territory)
  { id: "agi",       name: "AGI Framework",   difficulty: 10, reward: 500000,  lines: 1000000, minAgents: 100, tier: 5 },
];

export function isProjectUnlocked(proj, state) {
  // Tier gating: need to ship projects from previous tier
  const tierThresholds = { 1: 0, 2: 2, 3: 8, 4: 20, 5: 50 };
  return state.projectsShipped >= (tierThresholds[proj.tier] || 0);
}

export function projectReward(proj, revenueMult, prestigeBonus, memoryMult) {
  return Math.floor(proj.reward * revenueMult * prestigeBonus * memoryMult);
}
