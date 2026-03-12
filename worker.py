#!/usr/bin/env python3
"""
Agent Command Center — Real Compute Worker
Receives work orders from the game UI, executes real commands, reports results.

Zero dependencies. stdlib only.
Run: python3 worker.py
"""

import http.server
import json
import subprocess
import threading
import time
import os
import uuid
from pathlib import Path

PORT = 3001
PYTHON = "/opt/homebrew/bin/python3.11"
HOME = Path.home()

# ─── REAL COMMAND MAP ──────────────────────────────────────
# Each research tier / project maps to actual shell commands.
# These run on YOUR machine, burning YOUR compute.

COMMANDS = {
    # ── ANE Training ──────────────────────────────────
    "ane_0": {
        "name": "ANE Basic Training Loop",
        "cmd": ["make", "run"],
        "cwd": "/tmp/autoresearch-ANE",
        "timeout": 300,
        "check_exists": "/tmp/autoresearch-ANE/Makefile",
    },
    "ane_1": {
        "name": "ANE Weight Packing Run",
        "cmd": ["make", "run"],
        "cwd": "/tmp/autoresearch-ANE",
        "timeout": 600,
        "check_exists": "/tmp/autoresearch-ANE/Makefile",
    },

    # ── LoRA Tuning ───────────────────────────────────
    "lora_0": {
        "name": "LoRA SFT Training",
        "cmd": [PYTHON, "-m", "mlx_lm.lora",
                "--model", "mlx-community/Qwen2.5-1.5B-Instruct-4bit",
                "--data", "training",
                "--train",
                "--iters", "100",
                "--batch-size", "1",
                "--lora-layers", "8",
                "--learning-rate", "1e-5"],
        "cwd": str(HOME / "Documents/ledatic-reports"),
        "timeout": 900,
        "check_exists": str(HOME / "Documents/ledatic-reports/training/train.jsonl"),
    },
    "lora_1": {
        "name": "LoRA Evaluation",
        "cmd": [PYTHON, "-m", "mlx_lm.lora",
                "--model", "mlx-community/Qwen2.5-1.5B-Instruct-4bit",
                "--data", "training",
                "--test"],
        "cwd": str(HOME / "Documents/ledated-reports"),
        "timeout": 300,
        "check_exists": str(HOME / "Documents/ledatic-reports/training/test.jsonl"),
    },

    # ── Benchmarking ──────────────────────────────────
    "bench_0": {
        "name": "Model Health Check",
        "cmd": ["curl", "-s", "-X", "POST", "http://localhost:8080/v1/chat/completions",
                "-H", "Content-Type: application/json",
                "-d", '{"model":"default","messages":[{"role":"user","content":"Respond with OK if operational."}],"max_tokens":10}'],
        "cwd": str(HOME),
        "timeout": 30,
    },
    "bench_1": {
        "name": "Autoresearch Experiment",
        "cmd": [PYTHON, "tools/batch_analyze.py", "full", "--days", "3"],
        "cwd": str(HOME / "empire"),
        "timeout": 600,
        "check_exists": str(HOME / "empire/tools/batch_analyze.py"),
    },

    # ── Architecture ──────────────────────────────────
    "arch_0": {
        "name": "Pipeline Smoke Test",
        "cmd": [PYTHON, "-c", "import pipeline; print('Pipeline module OK')"],
        "cwd": str(HOME / "Documents/ledatic-reports"),
        "timeout": 30,
    },
    "arch_1": {
        "name": "Domain Plugin Validation",
        "cmd": [PYTHON, "-c", "from domains.ad_intel import AdIntelPlugin; from domains.brand_intel import BrandIntelPlugin; print(f'Plugins OK: {AdIntelPlugin.DOMAIN_ID}, {BrandIntelPlugin.DOMAIN_ID}')"],
        "cwd": str(HOME / "Documents/ledatic-reports"),
        "timeout": 30,
    },

    # ── Empire Tests ──────────────────────────────────
    "test_empire": {
        "name": "Empire Test Suite",
        "cmd": [PYTHON, "-m", "pytest", "tests/", "-q", "--tb=short"],
        "cwd": str(HOME / "empire"),
        "timeout": 120,
        "check_exists": str(HOME / "empire/tests"),
    },

    # ── Service Health ────────────────────────────────
    "health_mlx": {
        "name": "MLX Health",
        "cmd": ["curl", "-sf", "http://localhost:8080/v1/models"],
        "timeout": 10,
    },
    "health_autonomy": {
        "name": "Autonomy Health",
        "cmd": ["curl", "-sf", "http://localhost:5590/health"],
        "timeout": 10,
    },
    "health_adintel": {
        "name": "Ad Intel Health",
        "cmd": ["curl", "-sf", "http://localhost:5580/health"],
        "timeout": 10,
    },

    # ── GPU/System ────────────────────────────────────
    "gpu_status": {
        "name": "GPU Memory Status",
        "cmd": ["sudo", "sysctl", "iogpu.wired_limit_mb"],
        "timeout": 5,
    },
    "services_status": {
        "name": "Service Status",
        "cmd": ["bash", "-c", "launchctl list | grep ledatic"],
        "timeout": 10,
    },
}

# ─── JOB TRACKER ──────────────────────────────────────────

jobs = {}  # id -> { status, command, output, started, finished, name }
lock = threading.Lock()


def run_job(job_id, cmd_key):
    """Execute a real command in a thread."""
    cmd_def = COMMANDS.get(cmd_key)
    if not cmd_def:
        with lock:
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["output"] = f"Unknown command: {cmd_key}"
            jobs[job_id]["finished"] = time.time()
        return

    # Pre-flight check
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
            capture_output=True,
            text=True,
            timeout=cmd_def.get("timeout", 120),
        )
        with lock:
            jobs[job_id]["status"] = "complete" if result.returncode == 0 else "failed"
            jobs[job_id]["output"] = (result.stdout + result.stderr)[-2000:]  # cap output
            jobs[job_id]["exit_code"] = result.returncode
            jobs[job_id]["finished"] = time.time()
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


class WorkerHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Quiet logging
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
            # List available commands
            cmds = {k: {"name": v["name"]} for k, v in COMMANDS.items()}
            self._json(200, cmds)

        elif self.path == "/jobs":
            with lock:
                self._json(200, jobs)

        elif self.path.startswith("/job/"):
            job_id = self.path[5:]
            with lock:
                job = jobs.get(job_id)
            if job:
                self._json(200, job)
            else:
                self._json(404, {"error": "not found"})

        elif self.path == "/status":
            # Quick system status — services + GPU
            running = 0
            failed = 0
            with lock:
                for j in jobs.values():
                    if j["status"] == "running":
                        running += 1
                    elif j["status"] == "failed":
                        failed += 1
            self._json(200, {
                "running_jobs": running,
                "failed_jobs": failed,
                "total_jobs": len(jobs),
                "available_commands": len(COMMANDS),
            })

        else:
            self._json(404, {"error": "not found"})

    def do_POST(self):
        if self.path == "/run":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length)) if length else {}
            cmd_key = body.get("command")

            if not cmd_key or cmd_key not in COMMANDS:
                self._json(400, {"error": f"Unknown command. Available: {list(COMMANDS.keys())}"})
                return

            # Check if same command is already running
            with lock:
                for jid, j in jobs.items():
                    if j.get("command") == cmd_key and j["status"] == "running":
                        self._json(409, {"error": "Already running", "job_id": jid})
                        return

            job_id = str(uuid.uuid4())[:8]
            with lock:
                jobs[job_id] = {
                    "status": "queued",
                    "command": cmd_key,
                    "name": COMMANDS[cmd_key]["name"],
                    "output": None,
                    "started": time.time(),
                    "finished": None,
                }

            thread = threading.Thread(target=run_job, args=(job_id, cmd_key), daemon=True)
            thread.start()

            self._json(200, {"job_id": job_id, "command": cmd_key, "status": "queued"})

        elif self.path == "/run-batch":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length)) if length else {}
            commands = body.get("commands", [])

            results = []
            for cmd_key in commands:
                if cmd_key not in COMMANDS:
                    results.append({"command": cmd_key, "error": "unknown"})
                    continue

                job_id = str(uuid.uuid4())[:8]
                with lock:
                    jobs[job_id] = {
                        "status": "queued",
                        "command": cmd_key,
                        "name": COMMANDS[cmd_key]["name"],
                        "output": None,
                        "started": time.time(),
                        "finished": None,
                    }
                thread = threading.Thread(target=run_job, args=(job_id, cmd_key), daemon=True)
                thread.start()
                results.append({"job_id": job_id, "command": cmd_key, "status": "queued"})

            self._json(200, results)

        else:
            self._json(404, {"error": "not found"})


def main():
    server = http.server.HTTPServer(("127.0.0.1", PORT), WorkerHandler)
    print(f"\n  ACC Worker alive on http://localhost:{PORT}")
    print(f"  {len(COMMANDS)} commands registered\n")
    print("  Commands:")
    for k, v in COMMANDS.items():
        print(f"    {k:20s} → {v['name']}")
    print()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Worker stopped.")


if __name__ == "__main__":
    main()
