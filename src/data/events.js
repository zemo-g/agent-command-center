// Random events that spice up gameplay

export const EVENTS = [
  // Good events (40% chance)
  {
    id: 'power_surge',
    type: 'good',
    name: 'Power Surge',
    icon: '⚡',
    description: 'A solar flare amplifies your fusion reactors!',
    effect: (state) => ({ energy: state.resources.energy + 80 }),
    logMessage: 'Power surge! +80 ⚡ energy',
  },
  {
    id: 'data_cache',
    type: 'good',
    name: 'Data Cache Found',
    icon: '💾',
    description: 'Your scouts discovered an abandoned data repository.',
    effect: (state) => ({ cycles: state.resources.cycles + 60 }),
    logMessage: 'Data cache discovered! +60 ◈ cycles',
  },
  {
    id: 'funding_grant',
    type: 'good',
    name: 'Funding Grant',
    icon: '◇',
    description: 'Anonymous benefactor sends a generous donation.',
    effect: (state) => ({ credits: state.resources.credits + 150 }),
    logMessage: 'Funding grant received! +150 ◇ credits',
  },
  {
    id: 'agent_volunteer',
    type: 'good',
    name: 'Agent Volunteer',
    icon: '👤',
    description: 'A skilled AI agent requests to join your operation.',
    effect: (state, getAgentCap) => {
      if (state.agents.length < getAgentCap(state)) {
        return { newAgent: true }
      }
      return { credits: state.resources.credits + 200 }
    },
    logMessage: 'New agent volunteered!',
    altLogMessage: 'Agent volunteer — no room. +200 ◇ instead.',
  },
  {
    id: 'efficiency_spike',
    type: 'good',
    name: 'Efficiency Spike',
    icon: '📈',
    description: 'Quantum fluctuation boosts all production temporarily.',
    effect: () => ({ tempBoost: { multiplier: 1.5, duration: 30 } }),
    logMessage: 'Efficiency spike! ×1.5 production for 30s',
  },

  // Bad events (40% chance)
  {
    id: 'system_overload',
    type: 'bad',
    name: 'System Overload',
    icon: '🔥',
    description: 'Reactor instability causes energy drain!',
    effect: (state) => ({ energy: Math.max(0, state.resources.energy - 50) }),
    logMessage: 'System overload! -50 ⚡ energy',
  },
  {
    id: 'memory_leak',
    type: 'bad',
    name: 'Memory Leak',
    icon: '🐛',
    description: 'A cascading memory leak corrupts your compute cycles.',
    effect: (state) => ({ cycles: Math.max(0, state.resources.cycles - 40) }),
    logMessage: 'Memory leak! -40 ◈ cycles',
  },
  {
    id: 'budget_cut',
    type: 'bad',
    name: 'Budget Cut',
    icon: '📉',
    description: 'Corporate overlords slash your operating budget.',
    effect: (state) => ({ credits: Math.max(0, state.resources.credits - 120) }),
    logMessage: 'Budget cut! -120 ◇ credits',
  },
  {
    id: 'security_breach',
    type: 'bad',
    name: 'Security Breach',
    icon: '🚨',
    description: 'Hostile intrusion! An agent is locked out for recovery.',
    effect: (state) => {
      const idleAgents = state.agents.filter(a => a.status === 'idle')
      if (idleAgents.length > 0) {
        return { lockAgent: idleAgents[0].id, lockDuration: 45 }
      }
      return { energy: Math.max(0, state.resources.energy - 30) }
    },
    logMessage: 'Security breach! Agent locked for 45s',
    altLogMessage: 'Security breach! -30 ⚡ (no idle agents to lock)',
  },
  {
    id: 'emp_pulse',
    type: 'bad',
    name: 'EMP Pulse',
    icon: '💥',
    description: 'Electromagnetic pulse disrupts operations.',
    effect: (state) => ({
      energy: Math.max(0, state.resources.energy - 30),
      cycles: Math.max(0, state.resources.cycles - 20),
    }),
    logMessage: 'EMP pulse! -30 ⚡, -20 ◈',
  },

  // Neutral events (20% chance)
  {
    id: 'anomaly',
    type: 'neutral',
    name: 'Anomaly Detected',
    icon: '❓',
    description: 'Strange signal detected. Investigate for potential reward?',
    effect: () => {
      // 60% chance of reward, 40% chance of penalty
      if (Math.random() < 0.6) {
        return { credits: 300 }
      }
      return { energy: -25, cycles: -15 }
    },
    logMessage: 'Anomaly investigated...',
  },
  {
    id: 'time_dilation',
    type: 'neutral',
    name: 'Time Dilation',
    icon: '⏳',
    description: 'Localized spacetime distortion. Missions accelerate briefly.',
    effect: () => ({ missionBoost: { speedMultiplier: 2, duration: 20 } }),
    logMessage: 'Time dilation! Missions ×2 speed for 20s',
  },
]

export function rollEvent(badEventChanceReduction = 0, goodBonusIncrease = 0) {
  const roll = Math.random()
  let pool
  if (roll < 0.4 - badEventChanceReduction) {
    pool = EVENTS.filter(e => e.type === 'bad')
  } else if (roll < 0.8 - badEventChanceReduction) {
    pool = EVENTS.filter(e => e.type === 'good')
  } else {
    pool = EVENTS.filter(e => e.type === 'neutral')
  }
  return pool[Math.floor(Math.random() * pool.length)]
}
