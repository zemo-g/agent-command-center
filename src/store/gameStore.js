// Zustand store — single source of truth for all game state

import { create } from 'zustand'
import {
  freshState, gameTick, buyBuilding, startMission, startResearch,
  recruitAgent, doPrestige, canBuyBuilding, canStartMission,
  canStartResearch, getAgentCapacity, getMissionSlots,
  getProductionRates, getResourceCaps, getRecruitCost, fmt, fmtTime,
} from '../engine/GameEngine.js'
import { getCurrentTier, getNextTier, getPrestigeBonus, TIERS } from '../data/tiers.js'
import { getUnlockedMissionTier, MISSIONS } from '../data/missions.js'
import { rollEvent } from '../data/events.js'
import { getResearchBonus } from '../data/research.js'
import { BUILDINGS, getBuildingCost } from '../data/buildings.js'
import * as sounds from '../audio/sounds.js'

const SAVE_KEY = 'nexus_command_save'
const TICK_MS = 500
const EVENT_INTERVAL_MIN = 45000
const EVENT_INTERVAL_MAX = 90000

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Validate critical fields
      if (parsed.resources && parsed.agents && parsed.buildings) {
        return { ...freshState(), ...parsed, lastTick: Date.now() }
      }
    }
  } catch (e) { /* corrupt save, start fresh */ }
  return freshState()
}

function save(state) {
  try {
    const toSave = { ...state }
    // Trim log to last 200 entries
    toSave.log = (toSave.log || []).slice(-200)
    localStorage.setItem(SAVE_KEY, JSON.stringify(toSave))
  } catch (e) { /* storage full or unavailable */ }
}

export const useGameStore = create((set, get) => {
  let tickInterval = null
  let saveInterval = null

  return {
    // State
    ...loadSave(),
    activeTab: 'overview',
    soundEnabled: true,
    showPrestigeModal: false,
    showTierUpModal: false,
    newTierLevel: null,

    // Computed getters (call these, don't store)
    getAgentCap: () => getAgentCapacity(get()),
    getMissionSlots: () => getMissionSlots(get()),
    getProductionRates: () => getProductionRates(get()),
    getResourceCaps: () => getResourceCaps(get()),
    getCurrentTier: () => getCurrentTier(get().totalCreditsEarned),
    getNextTier: () => getNextTier(get().totalCreditsEarned),
    getPrestigeBonus: () => getPrestigeBonus(get().prestigeLevel),
    getResearchBonus: () => getResearchBonus(get().research),
    getUnlockedMissionTier: () => getUnlockedMissionTier(get().completedMissions),
    getRecruitCost: () => getRecruitCost(get()),

    // Navigation
    setTab: (tab) => set({ activeTab: tab }),

    // Toggle sound
    toggleSound: () => set(s => ({ soundEnabled: !s.soundEnabled })),

    // Add log
    addLog: (type, text) => set(s => ({
      log: [...(s.log || []).slice(-199), { type, text, time: Date.now() }],
    })),

    // Buy building
    doBuyBuilding: (buildingId) => {
      const state = get()
      if (!canBuyBuilding(state, buildingId)) {
        if (state.soundEnabled) sounds.playError()
        return
      }
      const level = state.buildings[buildingId] || 0
      const b = BUILDINGS[buildingId]
      if (state.soundEnabled) {
        level === 0 ? sounds.playBuild() : sounds.playUpgrade()
      }
      const newState = buyBuilding(state, buildingId)
      set({
        ...newState,
        log: [...(state.log || []).slice(-199), {
          type: 'build',
          text: `${level === 0 ? 'Built' : 'Upgraded'} ${b.name} → Level ${level + 1}`,
          time: Date.now(),
        }],
      })
    },

    // Start mission
    doStartMission: (missionId) => {
      const state = get()
      const check = canStartMission(state, missionId)
      if (!check.ok) {
        if (state.soundEnabled) sounds.playError()
        get().addLog('error', `Cannot start mission: ${check.reason}`)
        return
      }
      if (state.soundEnabled) sounds.playMissionStart()
      const mission = MISSIONS.find(m => m.id === missionId)
      const newState = startMission(state, missionId)
      set({
        ...newState,
        log: [...(state.log || []).slice(-199), {
          type: 'mission_start',
          text: `Mission launched: ${mission.name} — ${mission.agents} agents deployed`,
          time: Date.now(),
        }],
      })
    },

    // Start research
    doStartResearch: (trackId) => {
      const state = get()
      const trackState = state.research[trackId]
      if (!trackState) return
      if (!canStartResearch(state, trackId, trackState.completed)) {
        if (state.soundEnabled) sounds.playError()
        return
      }
      if (state.soundEnabled) sounds.playClick()
      const newState = startResearch(state, trackId)
      set({
        ...newState,
        log: [...(state.log || []).slice(-199), {
          type: 'research_start',
          text: `Research started: ${trackId}`,
          time: Date.now(),
        }],
      })
    },

    // Recruit agent
    doRecruitAgent: () => {
      const state = get()
      const cap = getAgentCapacity(state)
      if (state.agents.length >= cap) {
        if (state.soundEnabled) sounds.playError()
        get().addLog('error', 'Agent bay full — upgrade to recruit more')
        return
      }
      const cost = getRecruitCost(state)
      if (state.resources.credits < cost) {
        if (state.soundEnabled) sounds.playError()
        get().addLog('error', `Need ${fmt(cost)} ◇ to recruit`)
        return
      }
      if (state.soundEnabled) sounds.playAgentRecruit()
      const newState = recruitAgent(state)
      const newAgent = newState.agents[newState.agents.length - 1]
      set({
        ...newState,
        log: [...(state.log || []).slice(-199), {
          type: 'recruit',
          text: `Agent ${newAgent.name} recruited — welcome aboard`,
          time: Date.now(),
        }],
      })
    },

    // Prestige
    doPrestige: () => {
      const state = get()
      const tier = getCurrentTier(state.totalCreditsEarned)
      if (tier.level < 5) return
      if (state.soundEnabled) sounds.playPrestige()
      const newState = doPrestige(state)
      set({ ...newState, showPrestigeModal: false })
    },

    setPrestigeModal: (show) => set({ showPrestigeModal: show }),
    setTierUpModal: (show) => set({ showTierUpModal: show, newTierLevel: show ? get().newTierLevel : null }),

    // Reset
    resetGame: () => {
      localStorage.removeItem(SAVE_KEY)
      set({ ...freshState(), activeTab: 'overview' })
    },

    // Start game loop
    startLoop: () => {
      if (tickInterval) return

      tickInterval = setInterval(() => {
        const state = get()
        const now = Date.now()
        const delta = Math.min((now - state.lastTick) / 1000, 2) // Cap at 2s to prevent huge jumps

        // Game tick
        const { state: newState, logs } = gameTick(state, delta)

        // Check for tier up
        const oldTier = getCurrentTier(state.totalCreditsEarned)
        const newTier = getCurrentTier(newState.totalCreditsEarned)
        let tierLogs = []
        if (newTier.level > oldTier.level) {
          if (state.soundEnabled) sounds.playTierUp()
          tierLogs = [{
            type: 'tier_up',
            text: `TIER UP! Welcome to ${newTier.name} — ${newTier.description}`,
            time: Date.now(),
          }]
        }

        // Check for research complete sounds
        for (const log of logs) {
          if (log.type === 'research_complete' && state.soundEnabled) {
            sounds.playResearchComplete()
          }
          if (log.type === 'mission_complete' && state.soundEnabled) {
            sounds.playMissionComplete()
          }
        }

        // Random events
        let eventLogs = []
        const timeSinceEvent = now - (state.lastEventTime || 0)
        const nextEventIn = EVENT_INTERVAL_MIN + Math.random() * (EVENT_INTERVAL_MAX - EVENT_INTERVAL_MIN)
        if (timeSinceEvent > nextEventIn && state.tickCount > 10) {
          const researchBonuses = getResearchBonus(state.research)
          const event = rollEvent(researchBonuses.eventChanceReduction, researchBonuses.eventBonusIncrease)
          if (event) {
            const effectResult = event.effect(newState, getAgentCapacity)
            const shieldLevel = state.buildings.shieldGrid || 0
            const damageReduction = Math.min(0.8, shieldLevel * 0.1 + researchBonuses.eventDamageReduction)

            // Apply effects
            if (effectResult.energy !== undefined) {
              const loss = newState.resources.energy - effectResult.energy
              if (loss > 0) {
                newState.resources.energy = newState.resources.energy - loss * (1 - damageReduction)
              } else {
                const bonusMult = 1 + researchBonuses.eventBonusIncrease
                newState.resources.energy = newState.resources.energy + Math.abs(loss) * bonusMult
              }
            }
            if (effectResult.cycles !== undefined) {
              const loss = newState.resources.cycles - effectResult.cycles
              if (loss > 0) {
                newState.resources.cycles = newState.resources.cycles - loss * (1 - damageReduction)
              } else {
                const bonusMult = 1 + researchBonuses.eventBonusIncrease
                newState.resources.cycles = newState.resources.cycles + Math.abs(loss) * bonusMult
              }
            }
            if (effectResult.credits !== undefined) {
              if (effectResult.credits > newState.resources.credits) {
                // Loss
                const loss = newState.resources.credits - effectResult.credits
                newState.resources.credits = Math.max(0, newState.resources.credits + loss * (1 - damageReduction))
              } else {
                const bonusMult = 1 + researchBonuses.eventBonusIncrease
                newState.resources.credits += effectResult.credits * bonusMult
              }
            }
            if (effectResult.tempBoost) {
              newState.tempBoost = { ...effectResult.tempBoost, until: now + effectResult.tempBoost.duration * 1000 }
            }
            if (effectResult.missionBoost) {
              newState.missionBoost = { ...effectResult.missionBoost, until: now + effectResult.missionBoost.duration * 1000 }
            }
            if (effectResult.lockAgent) {
              newState.agents = newState.agents.map(a =>
                a.id === effectResult.lockAgent
                  ? { ...a, status: 'locked', lockUntil: now + (effectResult.lockDuration || 45) * 1000 }
                  : a
              )
            }
            if (effectResult.newAgent) {
              const cap = getAgentCapacity(newState)
              if (newState.agents.length < cap) {
                const names = ['ARIA','NOVA','ECHO','SAGE','FLUX','IRIS','ONYX','VOLT','NEON','APEX','ZERO','BYTE']
                const id = newState.nextAgentId
                newState.agents = [...newState.agents, {
                  id, name: names[(id - 1) % names.length], level: 1, xp: 0,
                  status: 'idle', assignedTo: null, lockUntil: null,
                }]
                newState.nextAgentId = id + 1
              }
            }

            if (state.soundEnabled) {
              event.type === 'good' ? sounds.playEventGood() : event.type === 'bad' ? sounds.playEventBad() : sounds.playClick()
            }

            eventLogs = [{
              type: `event_${event.type}`,
              text: `[${event.icon} ${event.name}] ${event.logMessage}`,
              time: Date.now(),
            }]
            newState.lastEventTime = now
            newState.activeEvent = { ...event, expiresAt: now + 5000 }
            newState.stats.totalEventsHandled = (newState.stats.totalEventsHandled || 0) + 1
          }
        }

        // Clamp resources to 0
        newState.resources.energy = Math.max(0, newState.resources.energy)
        newState.resources.cycles = Math.max(0, newState.resources.cycles)
        newState.resources.credits = Math.max(0, newState.resources.credits)

        set({
          ...newState,
          lastTick: now,
          log: [
            ...(newState.log || []).slice(-(200 - logs.length - tierLogs.length - eventLogs.length)),
            ...logs,
            ...tierLogs,
            ...eventLogs,
          ],
          newTierLevel: newTier.level > oldTier.level ? newTier.level : state.newTierLevel,
          showTierUpModal: newTier.level > oldTier.level ? true : state.showTierUpModal,
        })
      }, TICK_MS)

      // Auto-save every 30s
      saveInterval = setInterval(() => {
        save(get())
      }, 30000)
    },

    stopLoop: () => {
      if (tickInterval) { clearInterval(tickInterval); tickInterval = null }
      if (saveInterval) { clearInterval(saveInterval); saveInterval = null }
      save(get())
    },

    // Manual save
    saveGame: () => save(get()),

    // Utility
    fmt,
    fmtTime,
  }
})
