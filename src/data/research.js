// Research tree — 4 tracks, 4 tiers each

export const RESEARCH_TRACKS = {
  power: {
    id: 'power',
    name: 'Power Systems',
    icon: '⚡',
    color: '#ffb000',
    description: 'Advanced energy generation and efficiency',
    tiers: [
      { name: 'Improved Fusion', cost: 80, duration: 25, bonus: { energyMultiplier: 0.25 }, desc: '+25% energy production' },
      { name: 'Plasma Containment', cost: 300, duration: 50, bonus: { energyMultiplier: 0.5 }, desc: '+50% energy production' },
      { name: 'Dark Energy Tap', cost: 1200, duration: 100, bonus: { energyMultiplier: 1.0 }, desc: '+100% energy production' },
      { name: 'Zero Point Field', cost: 5000, duration: 240, bonus: { energyMultiplier: 2.0, passiveEnergy: 5 }, desc: '+200% energy + 5 ⚡/s passive' },
    ],
  },
  computing: {
    id: 'computing',
    name: 'Quantum Computing',
    icon: '◈',
    color: '#00f0ff',
    description: 'Processing power and parallel computation',
    tiers: [
      { name: 'Qubit Scaling', cost: 100, duration: 25, bonus: { cyclesMultiplier: 0.25 }, desc: '+25% cycle production' },
      { name: 'Error Correction', cost: 400, duration: 50, bonus: { cyclesMultiplier: 0.5 }, desc: '+50% cycle production' },
      { name: 'Topological Qubits', cost: 1500, duration: 100, bonus: { cyclesMultiplier: 1.0, missionSpeedBonus: 0.15 }, desc: '+100% cycles + 15% faster missions' },
      { name: 'Quantum Supremacy', cost: 6000, duration: 240, bonus: { cyclesMultiplier: 2.0, missionSpeedBonus: 0.3, passiveCycles: 3 }, desc: '+200% cycles + 30% speed + 3 ◈/s passive' },
    ],
  },
  command: {
    id: 'command',
    name: 'Command & Control',
    icon: '🎯',
    color: '#00ff88',
    description: 'Agent capacity, training, and mission coordination',
    tiers: [
      { name: 'Neural Linking', cost: 120, duration: 30, bonus: { bonusAgents: 1, agentXpBonus: 0.2 }, desc: '+1 agent slot + 20% XP' },
      { name: 'Hive Protocol', cost: 500, duration: 60, bonus: { bonusAgents: 2, agentXpBonus: 0.5 }, desc: '+2 agent slots + 50% XP' },
      { name: 'Swarm Intelligence', cost: 2000, duration: 120, bonus: { bonusAgents: 3, bonusMissionSlots: 1 }, desc: '+3 agents + 1 mission slot' },
      { name: 'Collective Consciousness', cost: 8000, duration: 300, bonus: { bonusAgents: 5, bonusMissionSlots: 2, agentXpBonus: 1.0 }, desc: '+5 agents + 2 slots + 100% XP' },
    ],
  },
  defense: {
    id: 'defense',
    name: 'Cyber Defense',
    icon: '🛡',
    color: '#4488ff',
    description: 'System hardening and threat mitigation',
    tiers: [
      { name: 'Firewall v2', cost: 90, duration: 20, bonus: { eventDamageReduction: 0.1, eventChanceReduction: 0.05 }, desc: '-10% event damage, -5% bad events' },
      { name: 'Intrusion Detection', cost: 350, duration: 45, bonus: { eventDamageReduction: 0.2, eventChanceReduction: 0.1 }, desc: '-20% damage, -10% bad events' },
      { name: 'Adaptive Shield AI', cost: 1400, duration: 90, bonus: { eventDamageReduction: 0.35, eventBonusIncrease: 0.15 }, desc: '-35% damage, +15% good event rewards' },
      { name: 'Quantum Encryption', cost: 5500, duration: 200, bonus: { eventDamageReduction: 0.5, eventChanceReduction: 0.2, eventBonusIncrease: 0.3 }, desc: '-50% damage, -20% bad, +30% good rewards' },
    ],
  },
}

export function getResearchBonus(researchState) {
  const bonuses = {
    energyMultiplier: 0,
    cyclesMultiplier: 0,
    passiveEnergy: 0,
    passiveCycles: 0,
    missionSpeedBonus: 0,
    bonusAgents: 0,
    bonusMissionSlots: 0,
    agentXpBonus: 0,
    eventDamageReduction: 0,
    eventChanceReduction: 0,
    eventBonusIncrease: 0,
  }

  for (const [trackId, state] of Object.entries(researchState)) {
    const track = RESEARCH_TRACKS[trackId]
    if (!track) continue
    for (let i = 0; i < state.completed; i++) {
      const tier = track.tiers[i]
      if (!tier) break
      for (const [key, val] of Object.entries(tier.bonus)) {
        if (key in bonuses) bonuses[key] += val
      }
    }
  }

  return bonuses
}
