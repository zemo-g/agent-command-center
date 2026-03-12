// ─── BUILDING DEFINITIONS ─────────────────────────────────
// Red Alert style: each building is a strategic lever.
// Costs scale exponentially. Effects stack multiplicatively.

export const BUILDINGS = {
  barracks: {
    name: "Agent Barracks",
    icon: "\u{1F3D7}\uFE0F",
    desc: "Spawns coding agents",
    baseCost: 50,
    costScale: 1.4,
    effect: "agents",
    perLevel: 1,
    category: "workforce",
    unlockAt: 0, // available immediately
  },
  lab: {
    name: "Research Lab",
    icon: "\u{1F52C}",
    desc: "+skill multiplier to all agents",
    baseCost: 200,
    costScale: 1.6,
    effect: "skill",
    perLevel: 0.15,
    category: "workforce",
    unlockAt: 0,
  },
  server: {
    name: "Server Farm",
    icon: "\u{1F5A5}\uFE0F",
    desc: "Compute power \u2192 faster output",
    baseCost: 150,
    costScale: 1.5,
    effect: "speed",
    perLevel: 0.2,
    category: "infra",
    unlockAt: 0,
  },
  gateway: {
    name: "API Gateway",
    icon: "\u{1F310}",
    desc: "Monetizes completed work",
    baseCost: 300,
    costScale: 1.55,
    effect: "revenue",
    perLevel: 0.25,
    category: "infra",
    unlockAt: 2, // unlock after 2 projects shipped
  },
  training: {
    name: "Training Center",
    icon: "\u{1F4DA}",
    desc: "Agents learn faster, fewer bugs",
    baseCost: 500,
    costScale: 1.7,
    effect: "quality",
    perLevel: 0.1,
    category: "upgrade",
    unlockAt: 5,
  },
  oversight: {
    name: "Oversight Tower",
    icon: "\u{1F441}\uFE0F",
    desc: "Auto-review. Reduces rework.",
    baseCost: 800,
    costScale: 1.8,
    effect: "oversight",
    perLevel: 0.12,
    category: "upgrade",
    unlockAt: 10,
  },
  datacenter: {
    name: "Data Center",
    icon: "\u{1F4E1}",
    desc: "Persistent memory. Agents learn across projects.",
    baseCost: 2000,
    costScale: 2.0,
    effect: "memory",
    perLevel: 0.08,
    category: "upgrade",
    unlockAt: 20,
  },
  hq: {
    name: "HQ Tower",
    icon: "\u{1F3E2}",
    desc: "Unlocks parallel project slots",
    baseCost: 5000,
    costScale: 2.2,
    effect: "slots",
    perLevel: 1,
    category: "command",
    unlockAt: 15,
  },
};

export function buildingCost(def, level) {
  return Math.floor(def.baseCost * Math.pow(def.costScale, level));
}

export function isBuildingUnlocked(id, state) {
  const def = BUILDINGS[id];
  return state.projectsShipped >= def.unlockAt;
}
