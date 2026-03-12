import { T, CATEGORY_COLORS } from "../styles/theme.js";
import { fmt } from "../engine/GameEngine.js";

export function BuildingCard({ id, def, level, cost, funds, locked, onBuy }) {
  const canBuy = !locked && funds >= cost;
  const accent = CATEGORY_COLORS[def.category] || T.orange;

  if (locked) {
    return (
      <div style={{
        background: "rgba(30,30,30,0.4)",
        border: `1px solid ${T.bg2}`,
        borderRadius: T.radius,
        padding: "10px 12px",
        opacity: 0.3,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 18, filter: "grayscale(1)" }}>{def.icon}</span>
          <span style={{ color: T.bg4, fontSize: 10, fontFamily: T.mono }}>LOCKED</span>
        </div>
        <div style={{ color: T.bg4, fontSize: 12, marginTop: 4, fontFamily: T.display }}>
          {def.name}
        </div>
        <div style={{ color: T.bg4, fontSize: 9, marginTop: 2 }}>
          Ship {def.unlockAt} projects to unlock
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onBuy}
      disabled={!canBuy}
      style={{
        background: canBuy
          ? `linear-gradient(135deg, ${T.bg2} 0%, ${T.bg3} 100%)`
          : "rgba(40,40,40,0.6)",
        border: `1px solid ${canBuy ? accent : T.bg2}`,
        borderRadius: T.radius,
        padding: "10px 12px",
        textAlign: "left",
        cursor: canBuy ? "pointer" : "not-allowed",
        opacity: canBuy ? 1 : 0.5,
        transition: "all 0.15s ease",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 18 }}>{def.icon}</span>
        <span style={{
          background: accent,
          color: T.bg0,
          borderRadius: 10,
          padding: "1px 8px",
          fontSize: 11,
          fontWeight: 700,
          fontFamily: T.mono,
        }}>
          Lv {level}
        </span>
      </div>
      <div style={{
        color: T.fg1,
        fontSize: 13,
        fontWeight: 600,
        marginTop: 4,
        fontFamily: T.display,
      }}>
        {def.name}
      </div>
      <div style={{ color: T.fg4, fontSize: 10, marginTop: 2 }}>{def.desc}</div>
      <div style={{
        color: canBuy ? T.bYellow : T.bg4,
        fontSize: 11,
        marginTop: 6,
        fontFamily: T.mono,
        fontWeight: 700,
      }}>
        ${fmt(cost)}
      </div>
    </button>
  );
}
