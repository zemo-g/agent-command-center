// ─── GAME ENGINE ──────────────────────────────────────────
// Pure state machine. No React, no DOM, no side effects.
// Receives state, produces next state. That's it.
//
// The UI is a view. This is the truth.

import { BUILDINGS, buildingCost } from "./Buildings.js";
import { PROJECTS, projectReward, isProjectUnlocked } from "./Projects.js";
import { calcMultipliers, linesPerTick, bugChance, BASE_AGENT_OUTPUT } from "./Agents.js";
import { prestigeBonus, prestigeThreshold, canPrestige, MILESTONES } from "./Progression.js";
import { resolveWorkOrderSim } from "./AgentBridge.js";
import { createRewardLedger, recordProjectShipped, recordAgentOutput, recordTick, recordPrestige } from "./Rewards.js";
import { RESEARCH_TRACKS, freshResearchState, currentResearchTier, researchPerTick, isResearchMaxed } from "./Research.js";

export const TICK_MS = 500;

// ─── FRESH STATE ──────────────────────────────────────────
export function freshState(prestLevel = 0) {
  return {
    tick: 0,
    funds: 100,
    totalEarned: 0,
    lifetimeEarned: 0, // persists across prestige
    linesWritten: 0,
    bugsSquashed: 0,
    projectsShipped: 0,
    prestigeLevel: prestLevel,
    buildings: Object.fromEntries(Object.keys(BUILDINGS).map((k) => [k, 0])),
    activeProjects: [], // { id, name, progress, total, reward }
    agents: 0,
    log: [{ msg: "\u26A1 Command Center online. You are the operator.", t: Date.now() }],
    milestones: {}, // id -> true
    rewards: createRewardLedger(),
    research: freshResearchState(),
    researchBonuses: { speed: 0, quality: 0, skill: 0, oversight: 0, revenue: 0, memory: 0, agents: 0, slots: 0 },
    // Save slot
    savedAt: null,
  };
}

// ─── DERIVED STATE (computed each render, not stored) ─────
export function deriveState(state) {
  const mults = calcMultipliers(state.buildings, BUILDINGS);
  // Apply research bonuses on top of building multipliers
  const rb = state.researchBonuses || {};
  mults.speed += rb.speed || 0;
  mults.quality += rb.quality || 0;
  mults.skill += rb.skill || 0;
  mults.oversight += rb.oversight || 0;
  mults.revenue += rb.revenue || 0;
  mults.memory += rb.memory || 0;
  mults.maxSlots += rb.slots || 0;
  const effectiveAgents = state.agents + (rb.agents || 0);

  const pBonus = prestigeBonus(state.prestigeLevel);
  const lpt = linesPerTick(effectiveAgents, mults, pBonus);
  const bugs = bugChance(mults);
  const pThreshold = prestigeThreshold(state.prestigeLevel);
  const canPrest = canPrestige(state.totalEarned, state.prestigeLevel);
  const rpt = researchPerTick(effectiveAgents, mults.memory, pBonus);

  return { mults, pBonus, lpt, bugs, pThreshold, canPrest, rpt, effectiveAgents };
}

// ─── GAME TICK ────────────────────────────────────────────
// Called every TICK_MS. Advances all active projects.
export function gameTick(state) {
  const next = { ...state, tick: state.tick + 1 };
  const { mults, pBonus, lpt, bugs } = deriveState(state);
  const newLogs = [];

  // Distribute lines across active projects
  const actives = next.activeProjects.map((p) => ({ ...p }));
  let totalNewLines = 0;
  let totalBugs = 0;

  if (actives.length > 0 && lpt > 0) {
    const perProject = lpt / actives.length;
    const finished = [];

    for (let i = actives.length - 1; i >= 0; i--) {
      const resolved = resolveWorkOrderSim(
        { projectId: actives[i].id },
        perProject,
        bugs
      );

      actives[i].progress += resolved.output.linesWritten;
      totalNewLines += resolved.output.linesWritten;
      totalBugs += resolved.output.bugsFound;

      if (actives[i].progress >= actives[i].total) {
        const reward = projectReward(
          { reward: actives[i].reward },
          mults.revenue,
          pBonus,
          mults.memory
        );
        next.funds += reward;
        next.totalEarned += reward;
        next.lifetimeEarned += reward;
        next.projectsShipped += 1;
        recordProjectShipped(next.rewards, reward);
        finished.push({ name: actives[i].name, reward });
        actives.splice(i, 1);
      }
    }

    for (const f of finished) {
      newLogs.push({ msg: `\u{1F680} SHIPPED: ${f.name} \u2192 +$${fmt(f.reward)}`, t: Date.now() });
    }
  }

  next.linesWritten += totalNewLines;
  next.bugsSquashed += totalBugs;
  next.activeProjects = actives;

  // Record agent output
  if (totalNewLines > 0) {
    recordAgentOutput(next.rewards, totalNewLines, totalBugs, 1 - bugs);
  }
  recordTick(next.rewards);

  // Advance active research
  const research = { ...(next.research || freshResearchState()) };
  const rBonuses = { ...(next.researchBonuses || { speed: 0, quality: 0, skill: 0, oversight: 0, revenue: 0, memory: 0, agents: 0, slots: 0 }) };
  const { rpt } = deriveState(state);

  for (const [trackId, rState] of Object.entries(research)) {
    if (!rState.active) continue;
    const tier = currentResearchTier(trackId, rState.level);
    if (!tier) continue;

    research[trackId] = { ...rState, progress: rState.progress + rpt };

    if (research[trackId].progress >= tier.steps) {
      // Research complete — apply permanent bonus
      research[trackId] = { level: rState.level + 1, progress: 0, active: false };
      const eff = tier.effect;
      if (eff.type === "agents") {
        rBonuses.agents = (rBonuses.agents || 0) + eff.value;
      } else {
        rBonuses[eff.type] = (rBonuses[eff.type] || 0) + eff.value;
      }
      newLogs.push({
        msg: `\u{1F9EA} RESEARCH: ${tier.name} complete! ${tier.desc}`,
        t: Date.now(),
      });
    }
  }
  next.research = research;
  next.researchBonuses = rBonuses;

  // Check milestones
  for (const m of MILESTONES) {
    if (!next.milestones[m.id] && m.check(next)) {
      next.milestones[m.id] = true;
      next.funds += m.reward;
      next.totalEarned += m.reward;
      next.lifetimeEarned += m.reward;
      newLogs.push({ msg: `\u{1F3C6} MILESTONE: ${m.msg} +$${fmt(m.reward)}`, t: Date.now() });
    }
  }

  if (newLogs.length > 0) {
    next.log = [...next.log.slice(-60), ...newLogs];
  }

  return next;
}

// ─── ACTIONS ──────────────────────────────────────────────
// Pure functions: state in, state out.

export function buyBuilding(state, id) {
  const def = BUILDINGS[id];
  if (!def) return state;
  const cost = buildingCost(def, state.buildings[id]);
  if (state.funds < cost) return state;

  const next = {
    ...state,
    funds: state.funds - cost,
    buildings: { ...state.buildings, [id]: state.buildings[id] + 1 },
    agents: def.effect === "agents" ? state.agents + def.perLevel : state.agents,
  };

  const msg = def.effect === "agents"
    ? `\u{1F916} Agent recruited. Squad: ${next.agents}`
    : `\u{1F527} ${def.name} \u2192 Lv ${next.buildings[id]}`;

  next.log = [...next.log.slice(-60), { msg, t: Date.now() }];
  return next;
}

export function startProject(state, projId) {
  const proj = PROJECTS.find((p) => p.id === projId);
  if (!proj) return state;
  if (state.agents < proj.minAgents) return state;
  if (state.activeProjects.find((a) => a.id === proj.id)) return state;

  const { mults } = deriveState(state);
  if (state.activeProjects.length >= mults.maxSlots) return state;

  const next = {
    ...state,
    activeProjects: [
      ...state.activeProjects,
      { id: proj.id, name: proj.name, progress: 0, total: proj.lines, reward: proj.reward },
    ],
    log: [
      ...state.log.slice(-60),
      { msg: `\u{1F4CB} Project queued: ${proj.name} (${fmt(proj.lines)} lines)`, t: Date.now() },
    ],
  };

  return next;
}

export function doPrestige(state) {
  if (!canPrestige(state.totalEarned, state.prestigeLevel)) return state;
  const newLevel = state.prestigeLevel + 1;
  const next = freshState(newLevel);
  next.lifetimeEarned = state.lifetimeEarned;
  next.rewards = { ...state.rewards };
  next.milestones = {}; // milestones reset on prestige
  recordPrestige(next.rewards);
  next.log = [
    { msg: `\u{1F31F} PIVOT! Company reborn at Prestige ${newLevel} (${newLevel * 50}% bonus)`, t: Date.now() },
  ];
  return next;
}

export function startResearch(state, trackId) {
  const research = state.research || freshResearchState();
  const rState = research[trackId];
  if (!rState || rState.active) return state;
  if (isResearchMaxed(trackId, rState.level)) return state;

  const tier = currentResearchTier(trackId, rState.level);
  if (!tier || state.funds < tier.cost) return state;

  const next = {
    ...state,
    funds: state.funds - tier.cost,
    research: { ...research, [trackId]: { ...rState, active: true, progress: 0 } },
    log: [
      ...state.log.slice(-60),
      { msg: `\u{1F52C} Research started: ${tier.name} ($${fmt(tier.cost)})`, t: Date.now() },
    ],
  };
  return next;
}

// ─── SAVE / LOAD ──────────────────────────────────────────
const SAVE_KEY = "agent_command_center_save";

export function saveGame(state) {
  const toSave = { ...state, savedAt: Date.now() };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
    return true;
  } catch {
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    // Restore reward ledger structure if missing (save compat)
    if (!saved.rewards) saved.rewards = createRewardLedger();
    if (!saved.milestones) saved.milestones = {};
    if (!saved.research) saved.research = freshResearchState();
    if (!saved.researchBonuses) saved.researchBonuses = { speed: 0, quality: 0, skill: 0, oversight: 0, revenue: 0, memory: 0, agents: 0, slots: 0 };
    if (saved.lifetimeEarned == null) saved.lifetimeEarned = saved.totalEarned || 0;
    return saved;
  } catch {
    return null;
  }
}

export function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}

// ─── HELPERS ──────────────────────────────────────────────
export function fmt(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.floor(n).toString();
}

// Re-export for convenience
export { BUILDINGS, buildingCost, isBuildingUnlocked } from "./Buildings.js";
export { PROJECTS, isProjectUnlocked } from "./Projects.js";
export { calcMultipliers } from "./Agents.js";
export { prestigeBonus as getPrestigeBonus } from "./Progression.js";
export { teamScore } from "./Rewards.js";
export { RESEARCH_TRACKS, currentResearchTier, isResearchMaxed } from "./Research.js";
