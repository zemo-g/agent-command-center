import { useState, useEffect, useCallback } from "react";
import { T } from "../styles/theme.js";
import { workerHealth, runCommand, getAllJobs, runHealthChecks, getAvailableCommands } from "../engine/AgentBridge.js";

export function ComputePanel({ funds, onSpend, addLog }) {
  const [workerAlive, setWorkerAlive] = useState(false);
  const [jobs, setJobs] = useState({});
  const [commands, setCommands] = useState({});

  // Poll worker health + jobs every 2s
  useEffect(() => {
    const check = async () => {
      const alive = await workerHealth();
      setWorkerAlive(alive);
      if (alive) {
        const j = await getAllJobs();
        setJobs(j);
      }
    };
    check();
    const iv = setInterval(check, 2000);
    return () => clearInterval(iv);
  }, []);

  // Load available commands once
  useEffect(() => {
    const load = async () => {
      const cmds = await getAvailableCommands();
      if (cmds && !cmds.error) setCommands(cmds);
    };
    load();
  }, [workerAlive]);

  const fire = useCallback(async (cmdKey, cost) => {
    if (cost && funds < cost) return;
    if (cost && onSpend) onSpend(cost);
    const result = await runCommand(cmdKey);
    if (result.job_id) {
      if (addLog) addLog(`\u{1F525} FIRED: ${commands[cmdKey]?.name || cmdKey} [${result.job_id}]`);
    } else if (result.error) {
      if (addLog) addLog(`\u274C FAILED: ${cmdKey} — ${result.error}`);
    }
  }, [funds, commands, onSpend, addLog]);

  const fireHealthChecks = useCallback(async () => {
    const results = await runHealthChecks();
    if (Array.isArray(results)) {
      if (addLog) addLog(`\u{1F3E5} Health checks fired: ${results.length} services`);
    }
  }, [addLog]);

  const runningJobs = Object.entries(jobs).filter(([, j]) => j.status === "running");
  const recentJobs = Object.entries(jobs)
    .filter(([, j]) => j.status !== "running")
    .sort(([, a], [, b]) => (b.finished || 0) - (a.finished || 0))
    .slice(0, 8);

  return (
    <div>
      {/* Worker Status */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: workerAlive ? "#b8bb26" : "#cc241d",
          boxShadow: workerAlive ? "0 0 6px #b8bb26" : "0 0 6px #cc241d",
        }} />
        <span style={{ color: workerAlive ? T.bGreen : T.bRed, fontSize: 11, fontFamily: T.mono }}>
          Worker {workerAlive ? "LIVE :3001" : "OFFLINE"}
        </span>
        {!workerAlive && (
          <span style={{ color: T.fg4, fontSize: 9 }}>
            Run: python3 worker.py
          </span>
        )}
      </div>

      {!workerAlive ? (
        <div style={{
          background: "rgba(204,36,29,0.1)",
          border: `1px solid ${T.bg2}`,
          borderRadius: T.radius,
          padding: "12px",
          color: T.fg4,
          fontSize: 11,
          fontFamily: T.mono,
          lineHeight: 1.6,
        }}>
          No worker connected. Start it:<br />
          <span style={{ color: T.bYellow }}>cd ~/agent-command-center && python3 worker.py</span>
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          <div style={{ marginBottom: 10 }}>
            <SectionLabel label="Quick Actions" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              <CmdButton label="Health All" onClick={fireHealthChecks} />
              <CmdButton label="MLX Check" onClick={() => fire("health_mlx")} />
              <CmdButton label="Services" onClick={() => fire("services_status")} />
              <CmdButton label="GPU" onClick={() => fire("gpu_status")} />
            </div>
          </div>

          {/* Real Compute */}
          <div style={{ marginBottom: 10 }}>
            <SectionLabel label="Real Compute" />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <ComputeButton
                label="ANE Training Run"
                cost={1000}
                funds={funds}
                onClick={() => fire("ane_0", 1000)}
              />
              <ComputeButton
                label="LoRA Training (100 iter)"
                cost={2000}
                funds={funds}
                onClick={() => fire("lora_0", 2000)}
              />
              <ComputeButton
                label="LoRA Eval"
                cost={500}
                funds={funds}
                onClick={() => fire("lora_1", 500)}
              />
              <ComputeButton
                label="Pipeline Smoke Test"
                cost={200}
                funds={funds}
                onClick={() => fire("arch_0", 200)}
              />
              <ComputeButton
                label="Plugin Validation"
                cost={200}
                funds={funds}
                onClick={() => fire("arch_1", 200)}
              />
              <ComputeButton
                label="Empire Tests"
                cost={500}
                funds={funds}
                onClick={() => fire("test_empire", 500)}
              />
              <ComputeButton
                label="Batch Analysis (3d)"
                cost={3000}
                funds={funds}
                onClick={() => fire("bench_1", 3000)}
              />
            </div>
          </div>

          {/* Running Jobs */}
          {runningJobs.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <SectionLabel label={`Running (${runningJobs.length})`} />
              {runningJobs.map(([id, j]) => (
                <div key={id} style={{
                  background: "rgba(69,133,136,0.15)",
                  border: `1px solid ${T.blue}`,
                  borderRadius: T.radiusSm,
                  padding: "6px 10px",
                  marginBottom: 3,
                  fontSize: 10,
                  fontFamily: T.mono,
                  display: "flex",
                  justifyContent: "space-between",
                }}>
                  <span style={{ color: T.bBlue }}>{j.name}</span>
                  <span style={{ color: T.bYellow }}>{Math.floor(Date.now() / 1000 - j.started)}s</span>
                </div>
              ))}
            </div>
          )}

          {/* Recent Results */}
          {recentJobs.length > 0 && (
            <div>
              <SectionLabel label="Recent Results" />
              {recentJobs.map(([id, j]) => (
                <JobResult key={id} id={id} job={j} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SectionLabel({ label }) {
  return (
    <div style={{
      fontSize: 9,
      color: T.fg4,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 4,
      fontWeight: 700,
    }}>
      {label}
    </div>
  );
}

function CmdButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "rgba(60,56,54,0.6)",
        border: `1px solid ${T.bg2}`,
        borderRadius: 4,
        color: T.fg3,
        fontSize: 10,
        padding: "3px 8px",
        cursor: "pointer",
        fontFamily: T.mono,
      }}
    >
      {label}
    </button>
  );
}

function ComputeButton({ label, cost, funds, onClick }) {
  const canAfford = funds >= cost;
  return (
    <button
      onClick={onClick}
      disabled={!canAfford}
      style={{
        background: canAfford ? "rgba(254,128,25,0.08)" : "rgba(40,40,40,0.4)",
        border: `1px solid ${canAfford ? T.orange : T.bg2}`,
        borderRadius: T.radiusSm,
        padding: "6px 10px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: canAfford ? "pointer" : "not-allowed",
        opacity: canAfford ? 1 : 0.4,
        width: "100%",
        textAlign: "left",
      }}
    >
      <span style={{ color: T.fg1, fontSize: 11, fontFamily: T.display }}>{label}</span>
      <span style={{ color: canAfford ? T.bYellow : T.bg4, fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>
        ${cost}
      </span>
    </button>
  );
}

function JobResult({ id, job }) {
  const isOk = job.status === "complete";
  const color = isOk ? T.bGreen : job.status === "timeout" ? T.bYellow : T.bRed;
  const icon = isOk ? "\u2713" : job.status === "timeout" ? "\u23F0" : "\u2717";
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        background: "rgba(0,0,0,0.3)",
        border: `1px solid ${T.bg2}`,
        borderRadius: T.radiusSm,
        padding: "4px 8px",
        marginBottom: 2,
        cursor: "pointer",
      }}
    >
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 10,
        fontFamily: T.mono,
      }}>
        <span style={{ color }}>{icon} {job.name}</span>
        <span style={{ color: T.bg4 }}>{id}</span>
      </div>
      {expanded && job.output && (
        <pre style={{
          color: T.fg4,
          fontSize: 9,
          fontFamily: T.mono,
          marginTop: 4,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          maxHeight: 120,
          overflow: "auto",
          background: "rgba(0,0,0,0.3)",
          padding: 4,
          borderRadius: 3,
        }}>
          {job.output}
        </pre>
      )}
    </div>
  );
}
