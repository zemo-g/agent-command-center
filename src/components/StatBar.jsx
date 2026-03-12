import { T } from "../styles/theme.js";

export function StatBar({ label, value, icon, color }) {
  return (
    <div style={{ textAlign: "center", minWidth: 60 }}>
      <div style={{ fontSize: 16 }}>{icon}</div>
      <div style={{
        color: color || T.bYellow,
        fontSize: 16,
        fontWeight: 700,
        fontFamily: T.mono,
      }}>
        {value}
      </div>
      <div style={{
        color: T.bg4,
        fontSize: 9,
        textTransform: "uppercase",
        letterSpacing: 1,
      }}>
        {label}
      </div>
    </div>
  );
}
