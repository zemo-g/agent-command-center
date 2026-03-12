import { T } from "../styles/theme.js";
import { fmt } from "../engine/GameEngine.js";

export function ProjectCard({ proj, active, onStart, canStart, locked }) {
  if (locked) {
    return (
      <div style={{
        background: "rgba(30,30,30,0.3)",
        border: `1px solid ${T.bg2}`,
        borderRadius: T.radius,
        padding: "8px 12px",
        opacity: 0.25,
      }}>
        <div style={{ color: T.bg4, fontSize: 12, fontFamily: T.display }}>
          ??? {proj.tier > 3 ? "Enterprise" : "Tier " + proj.tier}
        </div>
        <div style={{ color: T.bg4, fontSize: 9, marginTop: 2 }}>Ship more to unlock</div>
      </div>
    );
  }

  // Active project — show progress bar
  if (active) {
    const pct = Math.min(100, (active.progress / active.total) * 100);
    return (
      <div style={{
        background: "rgba(69, 133, 136, 0.15)",
        border: `1px solid ${T.blue}`,
        borderRadius: T.radius,
        padding: "8px 12px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          left: 0, top: 0, bottom: 0,
          width: pct + "%",
          background: "rgba(69,133,136,0.2)",
          transition: "width 0.4s ease",
        }} />
        <div style={{ position: "relative" }}>
          <div style={{ color: T.bBlue, fontSize: 13, fontWeight: 600 }}>{proj.name}</div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 4,
            fontFamily: T.mono,
            fontSize: 11,
          }}>
            <span style={{ color: T.bAqua }}>{fmt(active.progress)} / {fmt(active.total)} lines</span>
            <span style={{ color: T.bYellow }}>{pct.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    );
  }

  // Available project
  const stars = "\u2605".repeat(Math.min(proj.difficulty, 10));
  return (
    <button
      onClick={onStart}
      disabled={!canStart}
      style={{
        background: canStart ? "rgba(152, 151, 26, 0.1)" : "rgba(40,40,40,0.4)",
        border: `1px solid ${canStart ? T.green : T.bg2}`,
        borderRadius: T.radius,
        padding: "8px 12px",
        textAlign: "left",
        cursor: canStart ? "pointer" : "not-allowed",
        opacity: canStart ? 1 : 0.45,
        width: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: T.fg1, fontSize: 13, fontWeight: 600 }}>{proj.name}</span>
        <span style={{ color: T.bYellow, fontSize: 11, fontFamily: T.mono }}>
          ${fmt(proj.reward)}
        </span>
      </div>
      <div style={{ color: T.fg4, fontSize: 10, marginTop: 3 }}>
        {stars} · {proj.minAgents}+ agents · {fmt(proj.lines)} lines
      </div>
    </button>
  );
}
