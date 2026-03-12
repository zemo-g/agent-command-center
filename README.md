# Agent Command Center

An idle game where humans direct AI agents to ship software. The twist: it drives real compute.

**You don't write code. You run a company.**

Buy infrastructure (Red Alert), ship projects (Egg Inc), research real ML training — ANE, LoRA, pipeline architecture. The game mechanics create pressure to invest wisely. The compute is real.

## Quick Start

```bash
./start.sh
```

Game: `http://localhost:3000` | Worker: `http://localhost:3001`

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Browser (React)           localhost:3000        │
│  ┌───────┐ ┌────────┐ ┌────────┐ ┌───────────┐ │
│  │Build- │ │Projects│ │Research│ │  Compute  │ │
│  │ings   │ │        │ │  Lab   │ │  (Real)   │ │
│  └───┬───┘ └───┬────┘ └───┬────┘ └─────┬─────┘ │
│      └─────────┴──────────┴─────────────┘       │
│                    Game Engine                    │
│              (pure JS state machine)             │
└──────────────────────┬──────────────────────────┘
                       │ HTTP
┌──────────────────────┴──────────────────────────┐
│  Worker (Python)       localhost:3001            │
│  ┌─────────┐ ┌──────┐ ┌────────┐ ┌───────────┐ │
│  │  ANE    │ │ LoRA │ │Pipeline│ │  Health   │ │
│  │Training │ │Tuning│ │ Tests  │ │  Checks   │ │
│  └─────────┘ └──────┘ └────────┘ └───────────┘ │
│              Real shell commands                  │
│              Real compute, real results           │
└──────────────────────────────────────────────────┘
```

## Game Mechanics

**Buildings** — Red Alert style. Each one is a strategic lever:
- Agent Barracks (headcount), Research Lab (skill), Server Farm (speed)
- API Gateway (revenue), Training Center (quality), Oversight Tower (auto-review)
- Data Center (memory), HQ Tower (parallel slots)

**Projects** — 14 contracts across 5 tiers. Ship to earn funds:
- CLI Tool → REST API → ML Pipeline → OS Kernel → AGI Framework

**Research** — 4 tracks, 5 tiers each. Maps to real infrastructure:
- ANE Training, LoRA Tuning, Architecture, Benchmarking

**Prestige** — Pivot your company. Reset with permanent multipliers.

**Real Compute** — Spend in-game funds to fire actual commands:
- ANE training runs, LoRA fine-tuning, test suites, health checks

## File Structure

```
src/
  engine/          Pure JS game logic (no React)
    GameEngine.js  State machine, tick loop, save/load
    Buildings.js   8 buildings with exponential costs
    Projects.js    14 projects across 5 tiers
    Agents.js      Workforce math + multipliers
    Research.js    4 research tracks (ANE, LoRA, Arch, Bench)
    Progression.js Prestige loop + milestones
    Rewards.js     Dual ledger (operator + device)
    AgentBridge.js Sim mode + live worker API
  components/      React UI components
  hooks/           useGameLoop — connects engine to React
  styles/          Gruvbox theme tokens
worker.py          Real compute worker (stdlib HTTP, zero deps)
start.sh           Launch both services
```

## Philosophy

The human directs. The agents build. The company ships.

The more time you invest directing strategy, the faster the flywheel spins.
But walk away and it still ticks.
