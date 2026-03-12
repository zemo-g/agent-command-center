// ─── RESEARCH LOOP ────────────────────────────────────────
// Research is the meta-game layer. While projects ship code,
// research improves the SYSTEM itself.
//
// Maps directly to real infrastructure:
//   - ANE Training  → Neural Engine experiments (autoresearch)
//   - LoRA Tuning   → Model fine-tuning (1.5B/9B adapters)
//   - Architecture   → System design improvements
//   - Benchmarking   → Evaluation and scoring
//
// Research produces DISCOVERIES that permanently buff buildings/agents.
// This is the Egg Inc "research" tree — exponential unlocks.

export const RESEARCH_TRACKS = {
  ane: {
    name: "ANE Training",
    icon: "\u{1F9E0}",
    desc: "Neural Engine experiments. Train while GPU serves inference.",
    color: "#b8bb26",
    tiers: [
      { name: "Basic Training Loop",    cost: 1000,   steps: 500,   effect: { type: "speed",   value: 0.1 }, desc: "+10% agent speed" },
      { name: "Weight Packing",         cost: 3000,   steps: 1200,  effect: { type: "speed",   value: 0.15 }, desc: "+15% speed (IOSurface pipeline)" },
      { name: "Dynamic Matmul",         cost: 8000,   steps: 3000,  effect: { type: "quality", value: 0.1 }, desc: "+10% quality (ANE SRAM)" },
      { name: "Concurrent Inference",   cost: 20000,  steps: 8000,  effect: { type: "agents",  value: 2 }, desc: "+2 agents (ANE invisible to GPU)" },
      { name: "Full ANE Pipeline",      cost: 50000,  steps: 20000, effect: { type: "speed",   value: 0.25 }, desc: "+25% speed (native Obj-C)" },
    ],
  },
  lora: {
    name: "LoRA Tuning",
    icon: "\u{1F9EC}",
    desc: "Fine-tune models per domain. Compound extraction quality.",
    color: "#83a598",
    tiers: [
      { name: "SFT Pairs (v1)",        cost: 2000,   steps: 800,   effect: { type: "quality", value: 0.1 }, desc: "+10% quality (86 pairs)" },
      { name: "CoT Refinement",        cost: 5000,   steps: 2000,  effect: { type: "quality", value: 0.12 }, desc: "+12% quality (chain-of-thought)" },
      { name: "Correction Pairs",      cost: 12000,  steps: 5000,  effect: { type: "oversight", value: 0.1 }, desc: "+10% oversight (error correction)" },
      { name: "DPO Training",          cost: 30000,  steps: 12000, effect: { type: "quality", value: 0.15 }, desc: "+15% quality (preference optimization)" },
      { name: "9B Adapter (Studio)",    cost: 100000, steps: 40000, effect: { type: "skill",   value: 0.3 }, desc: "+30% skill (needs 64GB+)" },
    ],
  },
  arch: {
    name: "Architecture",
    icon: "\u{1F3D7}\uFE0F",
    desc: "System design research. Unlock new building synergies.",
    color: "#fe8019",
    tiers: [
      { name: "Domain Plugin ABC",     cost: 1500,   steps: 600,   effect: { type: "slots",   value: 1 }, desc: "+1 project slot" },
      { name: "Pipeline Engine",       cost: 4000,   steps: 1500,  effect: { type: "speed",   value: 0.1 }, desc: "+10% speed (domain-agnostic)" },
      { name: "Priority Queue",        cost: 10000,  steps: 4000,  effect: { type: "revenue",  value: 0.15 }, desc: "+15% revenue (smart routing)" },
      { name: "Speculative Decode",    cost: 25000,  steps: 10000, effect: { type: "speed",   value: 0.2 }, desc: "+20% speed (draft+verify)" },
      { name: "Multi-Domain Platform", cost: 80000,  steps: 30000, effect: { type: "revenue",  value: 0.3 }, desc: "+30% revenue (recurring retainers)" },
    ],
  },
  bench: {
    name: "Benchmarking",
    icon: "\u{1F4CA}",
    desc: "Evaluate and score. Data-driven optimization.",
    color: "#d3869b",
    tiers: [
      { name: "Basic Eval",            cost: 800,    steps: 400,   effect: { type: "quality", value: 0.05 }, desc: "+5% quality" },
      { name: "Autoresearch Loop",     cost: 3000,   steps: 1000,  effect: { type: "quality", value: 0.1 }, desc: "+10% quality (automated experiments)" },
      { name: "Val/Test Split",        cost: 8000,   steps: 3000,  effect: { type: "oversight", value: 0.08 }, desc: "+8% oversight (proper validation)" },
      { name: "Hyperparameter Search", cost: 20000,  steps: 8000,  effect: { type: "skill",   value: 0.15 }, desc: "+15% skill (optimal config)" },
      { name: "Continuous Benchmark",  cost: 60000,  steps: 25000, effect: { type: "memory",  value: 0.2 }, desc: "+20% memory (regression tracking)" },
    ],
  },
};

// Research state per track: { level: 0, progress: 0, active: false }
export function freshResearchState() {
  return Object.fromEntries(
    Object.keys(RESEARCH_TRACKS).map((k) => [k, { level: 0, progress: 0, active: false }])
  );
}

export function currentResearchTier(trackId, level) {
  const track = RESEARCH_TRACKS[trackId];
  if (!track || level >= track.tiers.length) return null;
  return track.tiers[level];
}

export function researchCost(trackId, level) {
  const tier = currentResearchTier(trackId, level);
  return tier ? tier.cost : Infinity;
}

export function isResearchMaxed(trackId, level) {
  const track = RESEARCH_TRACKS[trackId];
  return !track || level >= track.tiers.length;
}

// Research ticks: progress based on agents * memory multiplier
export function researchPerTick(agents, memoryMult, prestigeBonus) {
  return agents * 0.5 * memoryMult * prestigeBonus;
}
