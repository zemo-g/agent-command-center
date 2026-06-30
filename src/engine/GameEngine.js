// Core game engine — pure functions, no side effects
// Handles tick processing, resource generation, mission progress

import { BUILDINGS, getBuildingCost } from '../data/buildings.js'
import { getResearchBonus, RESEARCH_TRACKS } from '../data/research.js'
import { getMissionById } from '../data/missions.js'
import { getPrestigeBonus } from '../data/tiers.js'

// --- Resource caps ---
const BASE_RESOURCE_CAP = { energy: 500, cycles: 300, credits: Infinity }

export function getResourceCaps(state) {
  const vaultLevel = state.buildings.dataVault || 0
  const mult = 1 + vaultLevel * 0.25
  return {
    energy: Math.floor(BASE_RESOURCE_CAP.energy * mult),
    cycles: Math.floor(BASE_RESOURCE_CAP.cycles * mult),
    credits: Infinity,
  }
}

// --- Agent capacity ---
export function getAgentCapacity(state) {
  const bayLevel = state.buildings.agentBay || 0
  const research = getResearchBonus(state.research)
  return 2 + bayLevel * 2 + research.bonusAgents
}

// --- Mission slots ---
export function getMissionSlots(state) {
  const opsLevel = state.buildings.opsCenter || 0
  const research = getResearchBonus(state.research)
  return Math.max(1, opsLevel) + research.bonusMissionSlots
}

// --- Production rates per second ---
export function getProductionRates(state) {
  const research = getResearchBonus(state.research)
  const prestigeBonus = getPrestigeBonus(state.prestigeLevel)
  const reactorLevel = state.buildings.reactor || 0
  const quantumLevel = state.buildings.quantumArray || 0
  const qcLevel = state.buildings.quantumCore || 0
  const globalMult = 1 + (qcLevel * 0.5)

  // Temp boost
  let tempMult = 1
  if (state.tempBoost && state.tempBoost.until > Date.now()) {
    tempMult = state.tempBoost.multiplier
  }

  const energyPerSec = (
    (3 * reactorLevel * (1 + research.energyMultiplier) + research.passiveEnergy)
    * globalMult * prestigeBonus * tempMult
  )
  const cyclesPerSec = (
    (2 * quantumLevel * (1 + research.cyclesMultiplier) + research.passiveCycles)
    * globalMult * prestigeBonus * tempMult
  )

  return { energyPerSec, cyclesPerSec }
}

// --- Game tick (called every 500ms) ---
export function gameTick(state, deltaSeconds) {
  const newState = { ...state }
  const caps = getResourceCaps(state)
  const rates = getProductionRates(state)
  const research = getResearchBonus(state.research)
  const logs = []

  // 1. Generate resources
  newState.resources = { ...state.resources }
  newState.resources.energy = Math.min(caps.energy,
    state.resources.energy + rates.energyPerSec * deltaSeconds)
  newState.resources.cycles = Math.min(caps.cycles,
    state.resources.cycles + rates.cyclesPerSec * deltaSeconds)

  // 2. Progress active missions
  const missionSpeedMult = 1 + (research.missionSpeedBonus || 0)
  let missionBoostMult = 1
  if (state.missionBoost && state.missionBoost.until > Date.now()) {
    missionBoostMult = state.missionBoost.speedMultiplier
  }

  newState.activeMissions = []
  const completedThisTick = []
  for (const am of state.activeMissions) {
    const progress = am.progress + deltaSeconds * missionSpeedMult * missionBoostMult
    if (progress >= am.duration) {
      completedThisTick.push(am)
      const mission = getMissionById(am.missionId)
      if (mission) {
        newState.resources.credits += mission.reward
        logs.push({
          type: 'mission_complete',
          text: `Mission complete: ${mission.name} — +${mission.reward} ◇`,
          time: Date.now(),
        })
      }
    } else {
      newState.activeMissions.push({ ...am, progress })
    }
  }

  // Free agents from completed missions
  newState.agents = state.agents.map(a => {
    const wasBusy = completedThisTick.some(m => m.agentIds.includes(a.id))
    if (wasBusy) {
      const mission = getMissionById(completedThisTick.find(m => m.agentIds.includes(a.id))?.missionId)
      const xpBonus = 1 + (research.agentXpBonus || 0)
      const forgeLevel = state.buildings.neuralForge || 0
      const forgeMult = 1 + forgeLevel * 0.15
      const xpGain = Math.floor((mission?.xpReward || 10) * xpBonus * forgeMult)
      const newXp = a.xp + xpGain
      const newLevel = Math.floor(Math.sqrt(newXp / 50)) + 1
      return { ...a, status: 'idle', assignedTo: null, xp: newXp, level: Math.min(newLevel, 20) }
    }
    return a
  })

  // Unlock locked agents
  newState.agents = newState.agents.map(a => {
    if (a.status === 'locked' && a.lockUntil && Date.now() >= a.lockUntil) {
      return { ...a, status: 'idle', lockUntil: null }
    }
    return a
  })

  // Track completed missions
  newState.completedMissions = [
    ...state.completedMissions,
    ...completedThisTick.map(m => ({ missionId: m.missionId, completedAt: Date.now() })),
  ]

  // 3. Progress active research
  newState.research = { ...state.research }
  for (const [trackId, trackState] of Object.entries(state.research)) {
    if (trackState.active) {
      const progress = trackState.active.progress + deltaSeconds
      if (progress >= trackState.active.duration) {
        newState.research[trackId] = {
          completed: trackState.completed + 1,
          active: null,
        }
        const track = RESEARCH_TRACKS[trackId]
        const tier = track?.tiers[trackState.completed]
        logs.push({
          type: 'research_complete',
          text: `Research complete: ${tier?.name || trackId} — ${tier?.desc || ''}`,
          time: Date.now(),
        })
      } else {
        newState.research[trackId] = {
          ...trackState,
          active: { ...trackState.active, progress },
        }
      }
    }
  }

  // 4. Update stats
  newState.stats = { ...state.stats }
  newState.stats.totalEnergyProduced += rates.energyPerSec * deltaSeconds
  newState.stats.totalCyclesProduced += rates.cyclesPerSec * deltaSeconds
  newState.stats.totalMissionsCompleted = newState.completedMissions.length
  newState.stats.playTime += deltaSeconds

  // 5. Update total credits earned
  const creditsEarned = completedThisTick.reduce((sum, am) => {
    const m = getMissionById(am.missionId)
    return sum + (m?.reward || 0)
  }, 0)
  newState.totalCreditsEarned = (state.totalCreditsEarned || 0) + creditsEarned

  newState.tickCount = (state.tickCount || 0) + 1

  return { state: newState, logs }
}

// --- Actions ---
export function canBuyBuilding(state, buildingId) {
  const b = BUILDINGS[buildingId]
  if (!b) return false
  const level = state.buildings[buildingId] || 0
  if (level >= b.maxLevel) return false
  const cost = getBuildingCost(buildingId, level)
  return state.resources.credits >= cost
}

export function buyBuilding(state, buildingId) {
  const b = BUILDINGS[buildingId]
  if (!b) return state
  const level = state.buildings[buildingId] || 0
  if (level >= b.maxLevel) return state
  const cost = getBuildingCost(buildingId, level)
  if (state.resources.credits < cost) return state

  return {
    ...state,
    resources: { ...state.resources, credits: state.resources.credits - cost },
    buildings: { ...state.buildings, [buildingId]: level + 1 },
  }
}

export function canStartMission(state, missionId) {
  const mission = getMissionById(missionId)
  if (!mission) return { ok: false, reason: 'Unknown mission' }

  const slots = getMissionSlots(state)
  if (state.activeMissions.length >= slots) return { ok: false, reason: 'No mission slots available' }

  const idleAgents = state.agents.filter(a => a.status === 'idle')
  if (idleAgents.length < mission.agents) return { ok: false, reason: `Need ${mission.agents} idle agents (have ${idleAgents.length})` }

  if (state.resources.energy < mission.energyCost) return { ok: false, reason: `Need ${mission.energyCost} ⚡` }
  if (state.resources.cycles < mission.cyclesCost) return { ok: false, reason: `Need ${mission.cyclesCost} ◈` }

  return { ok: true }
}

export function startMission(state, missionId) {
  const mission = getMissionById(missionId)
  if (!mission) return state
  const check = canStartMission(state, missionId)
  if (!check.ok) return state

  const idleAgents = state.agents.filter(a => a.status === 'idle')
  const assigned = idleAgents.slice(0, mission.agents)
  const agentIds = assigned.map(a => a.id)

  return {
    ...state,
    resources: {
      ...state.resources,
      energy: state.resources.energy - mission.energyCost,
      cycles: state.resources.cycles - mission.cyclesCost,
    },
    agents: state.agents.map(a =>
      agentIds.includes(a.id)
        ? { ...a, status: 'mission', assignedTo: missionId }
        : a
    ),
    activeMissions: [
      ...state.activeMissions,
      { missionId, agentIds, progress: 0, duration: mission.duration, startedAt: Date.now() },
    ],
  }
}

export function canStartResearch(state, trackId, tierIndex) {
  const track = RESEARCH_TRACKS[trackId]
  if (!track) return false
  const trackState = state.research[trackId]
  if (!trackState) return false
  if (trackState.active) return false
  if (trackState.completed !== tierIndex) return false
  if (tierIndex >= track.tiers.length) return false
  const tier = track.tiers[tierIndex]
  return state.resources.cycles >= tier.cost
}

export function startResearch(state, trackId) {
  const track = RESEARCH_TRACKS[trackId]
  if (!track) return state
  const trackState = state.research[trackId]
  if (!trackState || trackState.active) return state
  const tierIndex = trackState.completed
  if (tierIndex >= track.tiers.length) return state
  const tier = track.tiers[tierIndex]
  if (state.resources.cycles < tier.cost) return state

  return {
    ...state,
    resources: { ...state.resources, cycles: state.resources.cycles - tier.cost },
    research: {
      ...state.research,
      [trackId]: {
        ...trackState,
        active: { tier: tierIndex, progress: 0, duration: tier.duration },
      },
    },
  }
}

export function recruitAgent(state) {
  const cap = getAgentCapacity(state)
  if (state.agents.length >= cap) return state
  const cost = Math.floor(100 * Math.pow(1.3, state.agents.length))
  if (state.resources.credits < cost) return state

  const names = ['ARIA', 'NOVA', 'ECHO', 'SAGE', 'FLUX', 'IRIS', 'ONYX', 'VOLT',
    'NEON', 'APEX', 'ZERO', 'BYTE', 'CORE', 'DASH', 'GRID', 'HACK',
    'JOLT', 'KILO', 'LYNX', 'MACH', 'NODE', 'OPUS', 'PROX', 'QUARK',
    'RIFT', 'SYNC', 'TRON', 'UNIT', 'VEX', 'WARP', 'XION', 'ZETA']
  const id = state.nextAgentId
  const nameIndex = (id - 1) % names.length
  const suffix = id <= names.length ? '' : `-${Math.floor((id - 1) / names.length) + 1}`

  return {
    ...state,
    resources: { ...state.resources, credits: state.resources.credits - cost },
    agents: [...state.agents, {
      id,
      name: `${names[nameIndex]}${suffix}`,
      level: 1,
      xp: 0,
      status: 'idle',
      assignedTo: null,
      lockUntil: null,
    }],
    nextAgentId: id + 1,
  }
}

export function getRecruitCost(state) {
  return Math.floor(100 * Math.pow(1.3, state.agents.length))
}

export function doPrestige(state) {
  return {
    ...freshState(),
    prestigeLevel: state.prestigeLevel + 1,
    stats: {
      ...state.stats,
    },
    log: [{
      type: 'prestige',
      text: `PRESTIGE LEVEL ${state.prestigeLevel + 1} — x${((state.prestigeLevel + 1) * 0.5 + 1).toFixed(1)} all production`,
      time: Date.now(),
    }],
  }
}

export function freshState() {
  return {
    resources: { energy: 0, cycles: 0, credits: 500 },
    buildings: {},
    agents: [
      { id: 1, name: 'ARIA', level: 1, xp: 0, status: 'idle', assignedTo: null, lockUntil: null },
      { id: 2, name: 'NOVA', level: 1, xp: 0, status: 'idle', assignedTo: null, lockUntil: null },
    ],
    nextAgentId: 3,
    research: {
      power: { completed: 0, active: null },
      computing: { completed: 0, active: null },
      command: { completed: 0, active: null },
      defense: { completed: 0, active: null },
    },
    activeMissions: [],
    completedMissions: [],
    totalCreditsEarned: 0,
    prestigeLevel: 0,
    tempBoost: null,
    missionBoost: null,
    activeEvent: null,
    log: [
      { type: 'system', text: 'NEXUS COMMAND initialized. Welcome, Commander.', time: Date.now() },
      { type: 'system', text: 'Build reactors for energy. Build quantum arrays for cycles.', time: Date.now() + 1 },
      { type: 'system', text: 'Launch missions to earn credits. Good luck.', time: Date.now() + 2 },
    ],
    stats: {
      totalEnergyProduced: 0,
      totalCyclesProduced: 0,
      totalCreditsEarned: 0,
      totalMissionsCompleted: 0,
      totalAgentsTrained: 0,
      totalResearchCompleted: 0,
      totalEventsHandled: 0,
      playTime: 0,
    },
    tickCount: 0,
    lastTick: Date.now(),
    lastEventTime: Date.now(),
  }
}

// Number formatting
export function fmt(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T'
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Math.floor(n).toString()
}

export function fmtTime(seconds) {
  if (seconds < 60) return `${Math.ceil(seconds)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}
