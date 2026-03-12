// ─── AGENT BRIDGE ─────────────────────────────────────────
// Connects game mechanics to real compute via worker.py on :3001
//
// LIVE MODE: Research tiers and projects fire real shell commands.
// The game tracks real execution, real results, real failures.
// You're not watching numbers go up. You're burning compute.

const WORKER_URL = "http://localhost:3001";

// ─── RESEARCH → COMMAND MAPPING ──────────────────────────
// Each research track tier maps to a real command key in worker.py
export const RESEARCH_COMMANDS = {
  ane:   ["ane_0", "ane_1", "ane_0", "ane_0", "ane_1"],       // ANE training tiers
  lora:  ["lora_0", "lora_1", "lora_0", "lora_0", "lora_0"],  // LoRA tiers
  arch:  ["arch_0", "arch_1", "arch_0", "arch_1", "arch_0"],   // Architecture tiers
  bench: ["bench_0", "bench_1", "bench_0", "bench_1", "bench_1"], // Benchmark tiers
};

// ─── WORKER API ──────────────────────────────────────────

export async function workerHealth() {
  try {
    const r = await fetch(`${WORKER_URL}/health`);
    return r.ok;
  } catch {
    return false;
  }
}

export async function runCommand(commandKey) {
  try {
    const r = await fetch(`${WORKER_URL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: commandKey }),
    });
    return await r.json();
  } catch (e) {
    return { error: e.message };
  }
}

export async function getJob(jobId) {
  try {
    const r = await fetch(`${WORKER_URL}/job/${jobId}`);
    return await r.json();
  } catch (e) {
    return { error: e.message };
  }
}

export async function getAllJobs() {
  try {
    const r = await fetch(`${WORKER_URL}/jobs`);
    return await r.json();
  } catch (e) {
    return {};
  }
}

export async function getAvailableCommands() {
  try {
    const r = await fetch(`${WORKER_URL}/commands`);
    return await r.json();
  } catch (e) {
    return {};
  }
}

export async function runHealthChecks() {
  try {
    const r = await fetch(`${WORKER_URL}/run-batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commands: ["health_mlx", "health_autonomy", "health_adintel", "services_status"] }),
    });
    return await r.json();
  } catch (e) {
    return { error: e.message };
  }
}

// ─── SIMULATION FALLBACK ─────────────────────────────────
// Used when worker is offline. Numbers still move but nothing real fires.

export function resolveWorkOrderSim(order, linesProduced, bugRate) {
  const bugsHit = Math.random() < bugRate * 0.3;
  const effectiveLines = linesProduced * (1 - bugRate);
  return {
    ...order,
    status: "complete",
    output: {
      linesWritten: effectiveLines,
      bugsFound: bugsHit ? 1 : 0,
      quality: 1 - bugRate,
    },
  };
}
