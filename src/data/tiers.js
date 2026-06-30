// Progression tiers and prestige system

export const TIERS = [
  {
    level: 1,
    name: 'Outpost',
    icon: '🏗',
    color: '#888888',
    description: 'A humble beginning. Establish basic operations.',
    creditsRequired: 0,
    features: ['Basic buildings', 'Tier 1 missions', 'Up to 4 agents'],
  },
  {
    level: 2,
    name: 'Station',
    icon: '🏢',
    color: '#00f0ff',
    description: 'Growing into a proper facility. Neural training online.',
    creditsRequired: 5000,
    features: ['Neural Forge unlocked', 'Tier 2 missions', 'Agent training', 'Up to 8 agents'],
  },
  {
    level: 3,
    name: 'Command Center',
    icon: '🎖',
    color: '#ffb000',
    description: 'A force to be reckoned with. Advanced research unlocked.',
    creditsRequired: 50000,
    features: ['Shield Grid unlocked', 'Tier 3 research', 'Tier 3 missions', 'Up to 14 agents'],
  },
  {
    level: 4,
    name: 'Fleet HQ',
    icon: '⭐',
    color: '#bf5fff',
    description: 'Commanding a fleet. Quantum technology within reach.',
    creditsRequired: 500000,
    features: ['Quantum Core unlocked', 'Tier 4 missions', 'Fleet coordination', 'Up to 20 agents'],
  },
  {
    level: 5,
    name: 'Nexus',
    icon: '💠',
    color: '#ff00ff',
    description: 'The pinnacle. Transcendence awaits.',
    creditsRequired: 5000000,
    features: ['Prestige available', 'All systems maxed', 'Unlimited potential'],
  },
]

export function getCurrentTier(totalCreditsEarned) {
  let tier = TIERS[0]
  for (const t of TIERS) {
    if (totalCreditsEarned >= t.creditsRequired) tier = t
    else break
  }
  return tier
}

export function getNextTier(totalCreditsEarned) {
  for (const t of TIERS) {
    if (totalCreditsEarned < t.creditsRequired) return t
  }
  return null // max tier
}

export function getPrestigeBonus(prestigeLevel) {
  return 1 + prestigeLevel * 0.5
}

export const AGENT_NAMES = [
  'ARIA', 'NOVA', 'ECHO', 'SAGE', 'FLUX', 'IRIS', 'ONYX', 'VOLT',
  'NEON', 'APEX', 'ZERO', 'BYTE', 'CORE', 'DASH', 'GRID', 'HACK',
  'JOLT', 'KILO', 'LYNX', 'MACH', 'NODE', 'OPUS', 'PROX', 'QUARK',
  'RIFT', 'SYNC', 'TRON', 'UNIT', 'VEX', 'WARP', 'XION', 'ZETA',
]
