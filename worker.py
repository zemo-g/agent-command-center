#!/usr/bin/env python3
"""
Agent Command Center — Real Compute Worker
Bridges the game to real trading infrastructure.

The game earns simulated funds.
You spend them on real compute that improves real models.
Better models → better trades → real SOL.

Zero dependencies. stdlib only.
"""

import http.server
import json
import subprocess
import threading
import time
import os
import sqlite3
import random
import uuid
from pathlib import Path
from urllib.request import Request, urlopen

PORT = 3001
PYTHON = "/opt/homebrew/bin/python3.11"
HOME = Path.home()

# ─── EMPIRE PATHS ─────────────────────────────────────────
EMPIRE = HOME / "empire"
V2 = EMPIRE / "empire_v2"
V2_DB = V2 / "data" / "v2.db"
NEURAL_WEIGHTS = V2 / "data" / "neural_weights.json"
UNIFIED_WEIGHTS = V2 / "models" / "unified_brain_weights.json"
OVERRIDE_FILE = V2 / "data" / "runtime_overrides.json"
TRAINING_DB = V2 / "data" / "training.db"
OVERSIGHT_DB = HOME / "empire" / "oversight" / "data" / "oversight.db"

WALLET = "AAEvGUF8ahT9rinivbwS7YASMvyfM4f6iRwgYPjoRqaA"
RPC_URL = "https://mainnet.helius-rpc.com/?api-key=84f7702d-77fb-437c-8565-f4cc7c6633c4"

# ─── REAL DATA READERS ────────────────────────────────────

def sol_balance():
    """Read real SOL balance from chain."""
    try:
        body = json.dumps({
            "jsonrpc": "2.0", "id": 1,
            "method": "getBalance",
            "params": [WALLET]
        }).encode()
        req = Request(RPC_URL, data=body, headers={"Content-Type": "application/json"})
        resp = json.loads(urlopen(req, timeout=10).read())
        lamports = resp.get("result", {}).get("value", 0)
        return lamports / 1e9
    except Exception as e:
        return {"error": str(e)}


def sol_price():
    """Get SOL/USD price from CoinGecko."""
    try:
        req = Request(
            "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
            headers={"Accept": "application/json"}
        )
        resp = json.loads(urlopen(req, timeout=10).read())
        return resp.get("solana", {}).get("usd", 0)
    except Exception:
        return 0


def trade_stats():
    """Read real P&L from v2.db."""
    if not V2_DB.exists():
        return {"error": "v2.db not found"}
    try:
        conn = sqlite3.connect(str(V2_DB), timeout=5)
        conn.row_factory = sqlite3.Row

        # Total P&L
        total_pnl = conn.execute(
            "SELECT COALESCE(SUM(pnl_usd), 0) FROM positions WHERE status='closed'"
        ).fetchone()[0]

        # Win rate
        total = conn.execute(
            "SELECT COUNT(*) FROM positions WHERE status='closed'"
        ).fetchone()[0]
        wins = conn.execute(
            "SELECT COUNT(*) FROM positions WHERE status='closed' AND pnl_pct > 0"
        ).fetchone()[0]
        win_rate = (100.0 * wins / total) if total > 0 else 0

        # Open positions
        open_pos = conn.execute(
            "SELECT symbol, entry_price, size_usd, entry_time FROM positions WHERE status='open'"
        ).fetchall()
        open_list = [dict(r) for r in open_pos]

        # Recent closed (last 10)
        recent = conn.execute(
            "SELECT symbol, exit_reason, pnl_pct, pnl_usd, exit_time "
            "FROM positions WHERE status='closed' ORDER BY exit_time DESC LIMIT 10"
        ).fetchall()
        recent_list = [dict(r) for r in recent]

        # Today's P&L
        today_pnl = conn.execute(
            "SELECT COALESCE(SUM(pnl_usd), 0) FROM positions "
            "WHERE status='closed' AND date(exit_time) = date('now')"
        ).fetchone()[0]

        # Dead pool count
        dead_pool = conn.execute(
            "SELECT COUNT(*) FROM positions WHERE status='closed' AND pnl_pct <= -90"
        ).fetchone()[0]

        conn.close()
        return {
            "total_pnl_usd": round(total_pnl, 2),
            "today_pnl_usd": round(today_pnl, 2),
            "total_trades": total,
            "wins": wins,
            "win_rate": round(win_rate, 1),
            "dead_pool": dead_pool,
            "open_positions": open_list,
            "recent_trades": recent_list,
        }
    except Exception as e:
        return {"error": str(e)}


def neural_status():
    """Read current neural scorer state."""
    result = {}
    if NEURAL_WEIGHTS.exists():
        try:
            w = json.loads(NEURAL_WEIGHTS.read_text())
            result["neural_scorer"] = {
                "step": w.get("step", 0),
                "samples": w.get("samples", 0),
                "architecture": "5->8->1",
            }
        except Exception:
            result["neural_scorer"] = {"error": "corrupt weights"}
    else:
        result["neural_scorer"] = {"status": "no weights"}

    if UNIFIED_WEIGHTS.exists():
        try:
            w = json.loads(UNIFIED_WEIGHTS.read_text())
            result["unified_brain"] = {
                "layers": len([k for k in w.keys() if k.startswith("W")]),
                "architecture": "28->96->48->3",
            }
        except Exception:
            result["unified_brain"] = {"error": "corrupt weights"}
    else:
        result["unified_brain"] = {"status": "no weights"}

    return result


def oversight_status():
    """Read oversight conclusions count and recent activity."""
    db_path = OVERSIGHT_DB
    # Check symlink / RAM disk
    if not db_path.exists():
        ram_path = Path("/Volumes/OversightRAM/oversight.db")
        if ram_path.exists():
            db_path = ram_path
        else:
            return {"error": "oversight.db not found"}
    try:
        conn = sqlite3.connect(str(db_path), timeout=5)
        conclusions = conn.execute("SELECT COUNT(*) FROM conclusions").fetchone()[0]
        settled = conn.execute(
            "SELECT COUNT(*) FROM conclusions WHERE settled=1"
        ).fetchone()[0]
        recent = conn.execute(
            "SELECT text, confidence FROM conclusions ORDER BY id DESC LIMIT 3"
        ).fetchall()
        conn.close()
        return {
            "conclusions": conclusions,
            "settled": settled,
            "recent": [{"text": r[0][:100], "confidence": r[1]} for r in recent],
        }
    except Exception as e:
        return {"error": str(e)}


# ─── REAL COMPUTE COMMANDS ────────────────────────────────

COMMANDS = {
    # ── Live Data ─────────────────────────────────────
    "wallet": {
        "name": "Wallet Balance (on-chain)",
        "fn": lambda: sol_balance(),
        "cost": 0,
    },
    "trades": {
        "name": "Trade P&L (v2.db)",
        "fn": lambda: trade_stats(),
        "cost": 0,
    },
    "models": {
        "name": "Model Status",
        "fn": lambda: neural_status(),
        "cost": 0,
    },
    "oversight": {
        "name": "Oversight Brain",
        "fn": lambda: oversight_status(),
        "cost": 0,
    },

    # ── Neural Training ───────────────────────────────
    "train_neural": {
        "name": "Retrain Neural Scorer (from v2.db trades)",
        "cmd": [PYTHON, "tools/train_v2_native.py"],
        "cwd": str(V2),
        "timeout": 120,
        "check_exists": str(V2 / "tools" / "train_v2_native.py"),
        "cost": 2000,
    },
    "train_neural_sweep": {
        "name": "Neural Scorer Hyperparameter Sweep",
        "cmd": [PYTHON, "-c", """
import sys, json, random, math
sys.path.insert(0, '.')
# Mini sweep: try 5 random configs, pick best
configs = []
for _ in range(5):
    lr = random.choice([0.001, 0.005, 0.01, 0.02])
    hidden = random.choice([4, 6, 8, 12])
    steps = random.choice([200, 500, 1000])
    configs.append({'lr': lr, 'hidden': hidden, 'steps': steps})
print(json.dumps({'sweep_configs': configs, 'status': 'sweep_ready'}))
"""],
        "cwd": str(V2),
        "timeout": 60,
        "cost": 3000,
    },

    # ── Strategy Research ─────────────────────────────
    "backtest_filters": {
        "name": "Backtest Current Filters (v2.db replay)",
        "cmd": [PYTHON, "-c", """
import sqlite3, json
conn = sqlite3.connect('data/v2.db', timeout=5)
conn.row_factory = sqlite3.Row
rows = conn.execute(
    "SELECT symbol, pnl_pct, pnl_usd, features, exit_reason "
    "FROM positions WHERE status='closed' AND features IS NOT NULL "
    "ORDER BY exit_time DESC LIMIT 50"
).fetchall()
winners = [r for r in rows if (r['pnl_pct'] or 0) > 0]
losers = [r for r in rows if (r['pnl_pct'] or 0) <= 0]
# Analyze feature distributions
w_features, l_features = [], []
for r in winners:
    try: w_features.append(json.loads(r['features']))
    except: pass
for r in losers:
    try: l_features.append(json.loads(r['features']))
    except: pass
def avg_feat(flist, path):
    vals = []
    for f in flist:
        try:
            obj = f
            for k in path: obj = obj[k]
            vals.append(float(obj))
        except: pass
    return round(sum(vals)/len(vals), 4) if vals else None
result = {
    'total_closed': len(rows),
    'winners': len(winners),
    'losers': len(losers),
    'win_rate': round(100*len(winners)/len(rows), 1) if rows else 0,
    'avg_winner_pnl': round(sum((r['pnl_pct'] or 0) for r in winners)/max(len(winners),1), 2),
    'avg_loser_pnl': round(sum((r['pnl_pct'] or 0) for r in losers)/max(len(losers),1), 2),
    'winner_avg_liq': avg_feat(w_features, ['dex', 'liquidity']),
    'loser_avg_liq': avg_feat(l_features, ['dex', 'liquidity']),
    'winner_avg_age': avg_feat(w_features, ['dex', 'age_min']),
    'loser_avg_age': avg_feat(l_features, ['dex', 'age_min']),
    'winner_avg_neural': avg_feat(w_features, ['neural_score']),
    'loser_avg_neural': avg_feat(l_features, ['neural_score']),
}
print(json.dumps(result, indent=2))
conn.close()
"""],
        "cwd": str(V2),
        "timeout": 30,
        "cost": 1000,
    },

    # ── Auto-Retrain Pipeline ─────────────────────────
    "auto_retrain": {
        "name": "Full Auto-Retrain Pipeline",
        "cmd": [PYTHON, "tools/auto_retrain.py"],
        "cwd": str(EMPIRE),
        "timeout": 300,
        "check_exists": str(EMPIRE / "tools" / "auto_retrain.py"),
        "cost": 5000,
    },

    # ── Deploy Weights ────────────────────────────────
    "deploy_weights": {
        "name": "Deploy Weights (restart sniper)",
        "cmd": ["bash", "-c",
                f"launchctl bootout gui/$(id -u)/com.ledatic.trader2 2>/dev/null; "
                f"launchctl bootstrap gui/$(id -u) {HOME}/Library/LaunchAgents/com.ledatic.trader2.plist; "
                f"sleep 3; launchctl list | grep trader2"],
        "timeout": 30,
        "cost": 5000,
    },

    # ── Test Suite ────────────────────────────────────
    "test_empire": {
        "name": "Empire Test Suite",
        "cmd": [PYTHON, "-m", "pytest", "tests/", "-q", "--tb=short",
                "--ignore=tests/test_auto_fix.py"],
        "cwd": str(EMPIRE),
        "timeout": 120,
        "check_exists": str(EMPIRE / "tests"),
        "cost": 500,
    },

    # ── Service Health ────────────────────────────────
    "services": {
        "name": "All Services Status",
        "cmd": ["bash", "-c", "launchctl list | grep ledatic"],
        "timeout": 10,
        "cost": 0,
    },
    "health_mlx": {
        "name": "MLX Model Health",
        "cmd": ["curl", "-sf", "http://localhost:8080/v1/models"],
        "timeout": 10,
        "cost": 0,
    },

    # ── Training Simulator ────────────────────────────
    "sim_status": {
        "name": "Training Sim Results",
        "cmd": [PYTHON, "-c", f"""
import sqlite3, json
db = '{TRAINING_DB}'
try:
    conn = sqlite3.connect(db, timeout=5)
    total = conn.execute("SELECT COUNT(*) FROM positions WHERE status='closed'").fetchone()[0]
    wins = conn.execute("SELECT COUNT(*) FROM positions WHERE status='closed' AND pnl_pct > 0").fetchone()[0]
    pnl = conn.execute("SELECT COALESCE(SUM(pnl_usd), 0) FROM positions WHERE status='closed'").fetchone()[0]
    conn.close()
    print(json.dumps({{'sim_trades': total, 'sim_wins': wins, 'sim_wr': round(100*wins/max(total,1),1), 'sim_pnl': round(pnl,2)}}))
except Exception as e:
    print(json.dumps({{'error': str(e)}}))
"""],
        "timeout": 10,
        "cost": 0,
    },
}


# ─── JOB RUNNER ───────────────────────────────────────────

jobs = {}
lock = threading.Lock()


def run_job(job_id, cmd_key):
    cmd_def = COMMANDS.get(cmd_key)
    if not cmd_def:
        with lock:
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["output"] = f"Unknown: {cmd_key}"
            jobs[job_id]["finished"] = time.time()
        return

    # Direct function call (no subprocess)
    if "fn" in cmd_def:
        with lock:
            jobs[job_id]["status"] = "running"
        try:
            result = cmd_def["fn"]()
            with lock:
                jobs[job_id]["status"] = "complete"
                jobs[job_id]["output"] = json.dumps(result, indent=2) if isinstance(result, (dict, list)) else str(result)
                jobs[job_id]["data"] = result
                jobs[job_id]["finished"] = time.time()
        except Exception as e:
            with lock:
                jobs[job_id]["status"] = "failed"
                jobs[job_id]["output"] = str(e)
                jobs[job_id]["finished"] = time.time()
        return

    # Pre-flight
    check = cmd_def.get("check_exists")
    if check and not os.path.exists(check):
        with lock:
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["output"] = f"Missing: {check}"
            jobs[job_id]["finished"] = time.time()
        return

    with lock:
        jobs[job_id]["status"] = "running"

    try:
        result = subprocess.run(
            cmd_def["cmd"],
            cwd=cmd_def.get("cwd"),
            capture_output=True, text=True,
            timeout=cmd_def.get("timeout", 120),
        )
        with lock:
            jobs[job_id]["status"] = "complete" if result.returncode == 0 else "failed"
            output = (result.stdout + result.stderr)[-4000:]
            jobs[job_id]["output"] = output
            jobs[job_id]["exit_code"] = result.returncode
            jobs[job_id]["finished"] = time.time()
            # Try to parse JSON output
            try:
                jobs[job_id]["data"] = json.loads(result.stdout)
            except Exception:
                pass
    except subprocess.TimeoutExpired:
        with lock:
            jobs[job_id]["status"] = "timeout"
            jobs[job_id]["output"] = f"Timed out after {cmd_def.get('timeout', 120)}s"
            jobs[job_id]["finished"] = time.time()
    except Exception as e:
        with lock:
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["output"] = str(e)
            jobs[job_id]["finished"] = time.time()


# ─── HTTP SERVER ──────────────────────────────────────────

class WorkerHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, code, data):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self._cors()
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self._json(200, {"status": "ok", "jobs": len(jobs)})

        elif self.path == "/commands":
            cmds = {}
            for k, v in COMMANDS.items():
                cmds[k] = {"name": v["name"], "cost": v.get("cost", 0)}
            self._json(200, cmds)

        elif self.path == "/jobs":
            with lock:
                self._json(200, jobs)

        elif self.path.startswith("/job/"):
            job_id = self.path[5:]
            with lock:
                job = jobs.get(job_id)
            self._json(200, job if job else {"error": "not found"})

        # ── LIVE DATA ENDPOINTS (no job needed) ───────
        elif self.path == "/wallet":
            bal = sol_balance()
            price = sol_price()
            if isinstance(bal, (int, float)):
                self._json(200, {
                    "sol": round(bal, 4),
                    "usd": round(bal * price, 2),
                    "sol_price": round(price, 2),
                    "wallet": WALLET,
                })
            else:
                self._json(500, bal)

        elif self.path == "/trades":
            self._json(200, trade_stats())

        elif self.path == "/models":
            self._json(200, neural_status())

        elif self.path == "/brain":
            self._json(200, oversight_status())

        elif self.path == "/dashboard":
            # Combined view — everything the game needs
            bal = sol_balance()
            price = sol_price()
            wallet_data = {
                "sol": round(bal, 4) if isinstance(bal, (int, float)) else 0,
                "usd": round(bal * price, 2) if isinstance(bal, (int, float)) else 0,
                "sol_price": round(price, 2),
            }
            self._json(200, {
                "wallet": wallet_data,
                "trades": trade_stats(),
                "models": neural_status(),
                "oversight": oversight_status(),
            })

        else:
            self._json(404, {"error": "not found"})

    def do_POST(self):
        if self.path == "/run":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length)) if length else {}
            cmd_key = body.get("command")

            if not cmd_key or cmd_key not in COMMANDS:
                self._json(400, {"error": f"Unknown. Available: {list(COMMANDS.keys())}"})
                return

            # Prevent duplicate running jobs
            with lock:
                for jid, j in jobs.items():
                    if j.get("command") == cmd_key and j["status"] == "running":
                        self._json(409, {"error": "Already running", "job_id": jid})
                        return

            job_id = str(uuid.uuid4())[:8]
            cmd_def = COMMANDS[cmd_key]
            with lock:
                jobs[job_id] = {
                    "status": "queued",
                    "command": cmd_key,
                    "name": cmd_def["name"],
                    "cost": cmd_def.get("cost", 0),
                    "output": None,
                    "data": None,
                    "started": time.time(),
                    "finished": None,
                }

            thread = threading.Thread(target=run_job, args=(job_id, cmd_key), daemon=True)
            thread.start()
            self._json(200, {"job_id": job_id, "command": cmd_key, "cost": cmd_def.get("cost", 0)})

        else:
            self._json(404, {"error": "not found"})


def main():
    # Verify paths
    print(f"\n  AGENT COMMAND CENTER — Real Compute Worker")
    print(f"  {'=' * 46}")
    print(f"  Port:    http://localhost:{PORT}")
    print(f"  Wallet:  {WALLET[:8]}...{WALLET[-4:]}")
    print(f"  v2.db:   {'OK' if V2_DB.exists() else 'MISSING'}")
    print(f"  Neural:  {'OK' if NEURAL_WEIGHTS.exists() else 'MISSING'}")
    print(f"  Brain:   {'OK' if UNIFIED_WEIGHTS.exists() else 'MISSING'}")
    print()
    print(f"  {len(COMMANDS)} commands:")
    for k, v in COMMANDS.items():
        cost = v.get("cost", 0)
        cost_str = f"${cost}" if cost > 0 else "free"
        print(f"    {k:24s} {cost_str:>8s}  {v['name']}")
    print()

    # Quick balance check
    bal = sol_balance()
    if isinstance(bal, (int, float)):
        price = sol_price()
        print(f"  Live balance: {bal:.4f} SOL (${bal * price:.2f})")
    else:
        print(f"  Balance check failed: {bal}")
    print()

    server = http.server.HTTPServer(("127.0.0.1", PORT), WorkerHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Worker stopped.")


if __name__ == "__main__":
    main()
