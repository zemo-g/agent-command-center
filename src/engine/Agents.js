// ─── AGENT SYSTEM ─────────────────────────────────────────
// Agents are the workforce. The human doesn't code — agents do.
// Future: specialization trees, traits, leveling. For now: headcount + multipliers.

// Agent output formula:
//   linesPerTick = agents * BASE_OUTPUT * skill * speed * quality * prestige
//
// BASE_OUTPUT is intentionally low. You NEED buildings to scale.
// This is the core idle game tension: invest in agents or multipliers?

export const BASE_AGENT_OUTPUT = 2; // lines per tick per agent, before multipliers

export function calcMultipliers(buildings, BUILDINGS) {
  const get = (id) => buildings[id] || 0;
  const bdef = (id) => BUILDINGS[id];

  return {
    skill:     1 + get("lab")       * bdef("lab").perLevel,
    speed:     1 + get("server")    * bdef("server").perLevel,
    revenue:   1 + get("gateway")   * bdef("gateway").perLevel,
    quality:   1 + get("training")  * bdef("training").perLevel,
    oversight: 1 + get("oversight") * bdef("oversight").perLevel,
    memory:    1 + get("datacenter") * bdef("datacenter").perLevel,
    maxSlots:  2 + get("hq")       * bdef("hq").perLevel, // base 2 parallel projects
  };
}

export function linesPerTick(agents, mults, prestigeBonus) {
  return agents * BASE_AGENT_OUTPUT * mults.skill * mults.speed * mults.quality * prestigeBonus;
}

export function bugChance(mults) {
  // Base 15% bug rate, reduced by quality and oversight
  // Floor at 2% — bugs never go to zero, that's the game tension
  return Math.max(0.02, 0.15 - (mults.quality - 1) * 0.3 - (mults.oversight - 1) * 0.4);
}
