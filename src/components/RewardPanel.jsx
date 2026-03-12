import { T } from "../styles/theme.js";
import { fmt } from "../engine/GameEngine.js";
import { teamScore } from "../engine/Rewards.js";

export function RewardPanel({ rewards }) {
  const score = teamScore(rewards);

  return (
    <div style={{
      background: "rgba(177,98,134,0.08)",
      border: `1px solid ${T.bg2}`,
      borderRadius: T.radius,
      padding: "10px 12px",
    }}>
      <div style={{
        fontSize: 10,
        color: T.bPurple,
        textTransform: "uppercase",
        letterSpacing: 2,
        fontWeight: 700,
        marginBottom: 8,
      }}>
        Team Score: {fmt(score)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <div style={{ color: T.fg4, fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>
            Operator
          </div>
          <div style={{ color: T.bOrange, fontSize: 11, fontFamily: T.mono, marginTop: 2 }}>
            ${fmt(rewards.operator.totalRevenue)} earned
          </div>
          <div style={{ color: T.fg4, fontSize: 10, fontFamily: T.mono }}>
            {rewards.operator.projectsDirected} directed
          </div>
          <div style={{ color: T.fg4, fontSize: 10, fontFamily: T.mono }}>
            {rewards.operator.prestigeResets} pivots
          </div>
        </div>
        <div>
          <div style={{ color: T.fg4, fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>
            Device
          </div>
          <div style={{ color: T.bAqua, fontSize: 11, fontFamily: T.mono, marginTop: 2 }}>
            {fmt(rewards.device.totalLines)} lines
          </div>
          <div style={{ color: T.fg4, fontSize: 10, fontFamily: T.mono }}>
            {rewards.device.totalBugsFixed} bugs fixed
          </div>
          <div style={{ color: T.fg4, fontSize: 10, fontFamily: T.mono }}>
            Q: {(rewards.device.qualityScore * 100).toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
}
