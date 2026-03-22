# Agent Command Center

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/worker_deps-0-brightgreen)](#)
[![React](https://img.shields.io/badge/frontend-React-blue)](#)

**Your hardware is your base. Real compute builds real assets.**

An RTS-inspired command center that turns your actual machines into a base-building game. Train ML models, compile code, deploy services, run benchmarks — every action costs real compute and produces real results. No simulation. No fake currency. The output is yours.

Inspired by Red Alert 2: you build structures, queue production, manage resources, and expand across nodes. Except the structures are services, the units are AI agents, the resources are CPU/GPU/RAM, and the assets you build are trained models, compiled binaries, and deployed systems.

```
┌──────────────────────────────────────────────────┐
│           AGENT COMMAND CENTER                    │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ BARRACKS │  │ WAR      │  │  CONSTRUCTION │  │
│  │ (Agents) │  │ FACTORY  │  │  YARD         │  │
│  │          │  │ (Models) │  │  (Pipelines)  │  │
│  │ 3 idle   │  │ LoRA:78% │  │  2 queued     │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ POWER    │  │ RADAR    │  │  ORE          │  │
│  │ PLANT    │  │ (Fleet)  │  │  REFINERY     │  │
│  │ (GPU)    │  │          │  │  (Revenue)    │  │
│  │ 8GB/8GB  │  │ 3 nodes  │  │  $0.19 SOL   │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
│                                                   │
│  [TRAIN MODEL]  [DEPLOY]  [RUN TESTS]  [BENCH]  │
│                                                   │
│  > LoRA training complete. val_loss: 0.48        │
│  > Deployed to production. 67/67 tests pass.     │
│  > New asset: adapters_v6 (7.2M params)          │
└──────────────────────────────────────────────────┘
```

## The Idea

Every computer is an underused factory. Your GPU sits idle 90% of the day. Your CPU runs at 5%. You have 24GB of unified memory doing nothing.

**Agent Command Center turns idle hardware into a production line.**

- **Build structures** — each one is a real service (ML server, compiler, training pipeline, monitoring agent)
- **Queue production** — train models, run benchmarks, compile code, deploy services. Every job is real.
- **Manage resources** — GPU memory is power. CPU is ore. RAM is capacity. Disk is storage. You can't build what you can't power.
- **Expand your base** — add nodes over Tailscale. Your laptop becomes a forward base. A cloud GPU becomes a weapons factory.
- **Produce assets** — trained models, compiled binaries, deployed sites, trading profits. Real things that persist after the game.

The game doesn't simulate anything. When you click "Train Model", a LoRA fine-tune runs on your GPU. When you click "Deploy", a binary ships to production. The progress bar is real. The output is real.

## Quick Start

```bash
git clone https://github.com/zemo-g/agent-command-center
cd agent-command-center
npm install
./start.sh
```

Game: `http://localhost:3000` | Worker: `http://localhost:3001`

The worker is zero-dependency Python (stdlib only). The frontend is React + Vite.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Browser (React)           localhost:3000        │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────┐  │
│  │ Base   │ │Product-│ │Research│ │ Command │  │
│  │ View   │ │ion Q   │ │  Lab   │ │  Feed   │  │
│  └───┬────┘ └───┬────┘ └───┬────┘ └────┬────┘  │
│      └──────────┴──────────┴────────────┘       │
│                  Game Engine                      │
│            (pure JS state machine)               │
└──────────────────────┬──────────────────────────┘
                       │ HTTP (poll + fire)
┌──────────────────────┴──────────────────────────┐
│  Worker (Python)       localhost:3001            │
│                                                  │
│  Commands:           Data Sources:               │
│  ┌─────────┐         ┌──────────────┐           │
│  │ train   │         │ GPU status   │           │
│  │ deploy  │         │ Model health │           │
│  │ test    │         │ Wallet/P&L   │           │
│  │ bench   │         │ Fleet nodes  │           │
│  └─────────┘         └──────────────┘           │
│                                                  │
│  Real shell commands. Real compute. Real output. │
└──────────────────────────────────────────────────┘
```

## Game Concepts → Real Infrastructure

| Red Alert 2 | Agent Command Center | What it actually does |
|-------------|---------------------|----------------------|
| Construction Yard | Pipeline Builder | Defines and chains compute jobs |
| Power Plant | GPU Allocator | Manages VRAM budget across services |
| Barracks | Agent Pool | Claude Code instances, fleet agents |
| War Factory | Model Trainer | LoRA, QLoRA, GRPO training runs |
| Ore Refinery | Revenue Engine | Trading P&L, deployment income |
| Radar | Fleet Monitor | Node health, latency, GPU utilization |
| Tech Center | Research Lab | Architecture search, hyperparameter sweeps |
| Spy Satellite | Oversight Brain | Autonomous pattern detection (nanoversight) |
| Build Queue | Job Queue | Serialized GPU access, priority ordering |
| Fog of War | Unknown Nodes | Nodes you haven't connected yet |
| Superweapon Timer | Training ETA | 10 hours until your model is ready |

## Structures

Each structure maps to a real service or capability:

| Structure | Level 1 | Level 2 | Level 3 |
|-----------|---------|---------|---------|
| **Agent Barracks** | 1 agent slot | 3 parallel agents | Fleet-wide coordination |
| **War Factory** | CPU-only training | GPU QLoRA (8GB) | Multi-GPU distributed |
| **Research Lab** | Manual hyperparams | Sweep search | Auto-architecture |
| **Server Farm** | 1 model served | 2 models + router | Priority queue (sluice) |
| **Radar Tower** | Local monitoring | 2-node fleet | Full fleet + Pi edge |
| **Ore Refinery** | Paper trading | Live ($3 size) | Scaled ($10+) |
| **Oversight Tower** | Manual review | nanoversight (auto) | Settled knowledge |
| **HQ** | 1 project | 3 parallel | Autonomous pipeline |

## Commands

Every button fires a real command. Zero simulation:

| Command | What it does | Cost |
|---------|-------------|------|
| `train_model` | QLoRA fine-tune on your GPU | GPU time |
| `deploy` | Ship binary to production | Service restart |
| `run_tests` | Execute test suite | CPU time |
| `benchmark` | Score model on fixed tasks | GPU + CPU |
| `health_check` | Ping all fleet nodes | Network |
| `retrain_neural` | Train neural scorer from trade data | GPU time |
| `backtest` | Replay strategy on historical data | CPU time |
| `compile` | Compile source to native binary | CPU time |

## Objectives

Tiered progression — you earn the right to scale by proving competence:

| Tier | Name | Example | Gate |
|------|------|---------|------|
| 1 | **Survive** | Complete 10 jobs without failure | — |
| 2 | **Learn** | Train a model that improves on baseline | Tier 1 |
| 3 | **Earn** | Produce an asset worth keeping | Tier 2 |
| 4 | **Scale** | Multi-node production pipeline | Tier 3 |

## Extending

The worker is a simple command registry. Add your own:

```python
# worker.py — add any command
COMMANDS["my_training"] = {
    "name": "Train my custom model",
    "cmd": ["python3", "train.py", "--epochs", "3"],
    "cwd": "/path/to/project",
    "timeout": 600,
    "cost": 5000,  # game currency
}
```

Data sources are just functions that return dicts:

```python
COMMANDS["my_metrics"] = {
    "name": "Project metrics",
    "fn": lambda: {
        "tests_passing": 47,
        "coverage": 82.3,
        "deploy_count": 12,
    },
    "cost": 0,
}
```

## Tech Stack

- **Frontend**: React 18 + Vite (the only npm dependency)
- **Worker**: Pure Python stdlib — zero pip installs
- **State**: localStorage (game) + real databases (worker)
- **Theme**: Gruvbox dark — built for terminals and late nights

## Vision

The endgame: open the game, see your base, see your fleet, see your production queues. Click "Train" and watch a real model train on real hardware. Click "Deploy" and watch it go live. The assets accumulate. The base grows. The models get smarter. The revenue goes up.

You're not playing a game. You're commanding infrastructure. The game just makes it fun.

## License

MIT
