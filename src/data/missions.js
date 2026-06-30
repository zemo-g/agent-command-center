// Mission definitions — 4 tiers of increasing difficulty and reward

export const MISSIONS = [
  // Tier 1 — available from start
  {
    id: 'recon',
    name: 'Reconnaissance',
    tier: 1,
    icon: '🔍',
    description: 'Scout the perimeter network for exploitable endpoints.',
    agents: 1,
    energyCost: 20,
    cyclesCost: 10,
    duration: 30,
    reward: 200,
    xpReward: 15,
  },
  {
    id: 'data_harvest',
    name: 'Data Harvest',
    tier: 1,
    icon: '📊',
    description: 'Extract and classify datasets from public sources.',
    agents: 1,
    energyCost: 30,
    cyclesCost: 20,
    duration: 45,
    reward: 350,
    xpReward: 20,
  },
  {
    id: 'sys_scan',
    name: 'System Scan',
    tier: 1,
    icon: '📡',
    description: 'Deep scan of target infrastructure. Map all nodes.',
    agents: 2,
    energyCost: 50,
    cyclesCost: 30,
    duration: 60,
    reward: 600,
    xpReward: 30,
  },

  // Tier 2 — unlocked after 3 tier-1 completions
  {
    id: 'net_infiltrate',
    name: 'Network Infiltration',
    tier: 2,
    icon: '🕸',
    description: 'Penetrate secure network segments. Establish persistent access.',
    agents: 2,
    energyCost: 100,
    cyclesCost: 60,
    duration: 90,
    reward: 1200,
    xpReward: 50,
  },
  {
    id: 'code_extract',
    name: 'Code Extraction',
    tier: 2,
    icon: '💻',
    description: 'Exfiltrate proprietary algorithms from secure repositories.',
    agents: 3,
    energyCost: 150,
    cyclesCost: 100,
    duration: 120,
    reward: 2000,
    xpReward: 70,
  },
  {
    id: 'crypto_break',
    name: 'Encryption Break',
    tier: 2,
    icon: '🔐',
    description: 'Crack quantum-resistant encryption using brute-force cycles.',
    agents: 3,
    energyCost: 200,
    cyclesCost: 150,
    duration: 150,
    reward: 3500,
    xpReward: 90,
  },

  // Tier 3 — unlocked after 3 tier-2 completions
  {
    id: 'sys_override',
    name: 'System Override',
    tier: 3,
    icon: '⚙',
    description: 'Take full control of a remote facility. High risk, high reward.',
    agents: 4,
    energyCost: 400,
    cyclesCost: 300,
    duration: 200,
    reward: 7000,
    xpReward: 150,
  },
  {
    id: 'ai_training',
    name: 'AI Training Op',
    tier: 3,
    icon: '🤖',
    description: 'Run a distributed training job across captured compute nodes.',
    agents: 5,
    energyCost: 600,
    cyclesCost: 500,
    duration: 300,
    reward: 12000,
    xpReward: 200,
  },
  {
    id: 'fleet_deploy',
    name: 'Fleet Deployment',
    tier: 3,
    icon: '🚀',
    description: 'Deploy agent fleet to coordinate multi-site operation.',
    agents: 5,
    energyCost: 800,
    cyclesCost: 600,
    duration: 360,
    reward: 20000,
    xpReward: 280,
  },

  // Tier 4 — unlocked after 3 tier-3 completions
  {
    id: 'neural_siege',
    name: 'Neural Siege',
    tier: 4,
    icon: '🧠',
    description: 'Overwhelm target AI defenses with coordinated neural attacks.',
    agents: 6,
    energyCost: 1500,
    cyclesCost: 1000,
    duration: 480,
    reward: 40000,
    xpReward: 500,
  },
  {
    id: 'quantum_breach',
    name: 'Quantum Breach',
    tier: 4,
    icon: '💠',
    description: 'Breach a quantum-secured vault. Requires peak computational power.',
    agents: 8,
    energyCost: 2500,
    cyclesCost: 2000,
    duration: 600,
    reward: 80000,
    xpReward: 750,
  },
  {
    id: 'singularity',
    name: 'Singularity Protocol',
    tier: 4,
    icon: '🌌',
    description: 'The final operation. Achieve technological transcendence.',
    agents: 10,
    energyCost: 5000,
    cyclesCost: 4000,
    duration: 900,
    reward: 200000,
    xpReward: 1500,
  },
]

export function getUnlockedMissionTier(completedMissions) {
  const tierCounts = { 1: 0, 2: 0, 3: 0, 4: 0 }
  for (const m of completedMissions) {
    const mission = MISSIONS.find(mi => mi.id === m.missionId)
    if (mission) tierCounts[mission.tier]++
  }
  if (tierCounts[3] >= 3) return 4
  if (tierCounts[2] >= 3) return 3
  if (tierCounts[1] >= 3) return 2
  return 1
}

export function getMissionById(id) {
  return MISSIONS.find(m => m.id === id)
}
