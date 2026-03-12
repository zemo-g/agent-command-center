import { T } from "../styles/theme.js";
import { fmt, RESEARCH_TRACKS, currentResearchTier, isResearchMaxed } from "../engine/GameEngine.js";

export function ResearchPanel({ research, researchBonuses, funds, rpt, onStart }) {
  return (
    <div>
      <div style={{
        fontSize: 10,
        color: T.bGreen,
        textTransform: "uppercase",
        letterSpacing: 2,
        marginBottom: 8,
        fontWeight: 700,
      }}>
        Research Lab
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {Object.entries(RESEARCH_TRACKS).map(([trackId, track]) => {
          const rState = research[trackId] || { level: 0, progress: 0, active: false };
          const maxed = isResearchMaxed(trackId, rState.level);
          const tier = currentResearchTier(trackId, rState.level);

          return (
            <ResearchCard
              key={trackId}
              track={track}
              trackId={trackId}
              rState={rState}
              tier={tier}
              maxed={maxed}
              funds={funds}
              rpt={rpt}
              onStart={() => onStart(trackId)}
            />
          );
        })}
      </div>
      {/* Active bonuses summary */}
      <ActiveBonuses bonuses={researchBonuses} />
    </div>
  );
}

function ResearchCard({ track, trackId, rState, tier, maxed, funds, rpt, onStart }) {
  if (maxed) {
    return (
      <div style={{
        background: `rgba(184, 187, 38, 0.08)`,
        border: `1px solid ${T.bg2}`,
        borderRadius: T.radius,
        padding: "8px 12px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 16 }}>{track.icon}</span>
          <span style={{ color: T.bGreen, fontSize: 10, fontFamily: T.mono }}>MAXED</span>
        </div>
        <div style={{ color: T.fg2, fontSize: 12, fontWeight: 600, marginTop: 2, fontFamily: T.display }}>
          {track.name}
        </div>
      </div>
    );
  }

  if (rState.active && tier) {
    const pct = Math.min(100, (rState.progress / tier.steps) * 100);
    const eta = rpt > 0 ? Math.ceil((tier.steps - rState.progress) / rpt / 2) : Infinity;
    const etaStr = eta > 3600 ? `${(eta / 3600).toFixed(1)}h` : eta > 60 ? `${Math.ceil(eta / 60)}m` : `${eta}s`;

    return (
      <div style={{
        background: `rgba(184, 187, 38, 0.1)`,
        border: `1px solid ${track.color}`,
        borderRadius: T.radius,
        padding: "8px 12px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          left: 0, top: 0, bottom: 0,
          width: pct + "%",
          background: `${track.color}22`,
          transition: "width 0.4s ease",
        }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14 }}>{track.icon}</span>
            <span style={{ color: track.color, fontSize: 10, fontFamily: T.mono }}>
              Lv {rState.level + 1}
            </span>
          </div>
          <div style={{ color: track.color, fontSize: 12, fontWeight: 600, marginTop: 2 }}>
            {tier.name}
          </div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 4,
            fontFamily: T.mono,
            fontSize: 10,
          }}>
            <span style={{ color: T.bAqua }}>{pct.toFixed(0)}%</span>
            <span style={{ color: T.fg4 }}>~{etaStr}</span>
          </div>
        </div>
      </div>
    );
  }

  // Available to start
  const canAfford = funds >= tier.cost;
  return (
    <button
      onClick={onStart}
      disabled={!canAfford}
      style={{
        background: canAfford ? "rgba(184, 187, 38, 0.06)" : "rgba(40,40,40,0.4)",
        border: `1px solid ${canAfford ? track.color : T.bg2}`,
        borderRadius: T.radius,
        padding: "8px 12px",
        textAlign: "left",
        cursor: canAfford ? "pointer" : "not-allowed",
        opacity: canAfford ? 1 : 0.45,
        width: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 14 }}>{track.icon}</span>
        <span style={{ color: T.fg4, fontSize: 10, fontFamily: T.mono }}>
          Lv {rState.level}/{RESEARCH_TRACKS[trackId].tiers.length}
        </span>
      </div>
      <div style={{ color: T.fg1, fontSize: 12, fontWeight: 600, marginTop: 2, fontFamily: T.display }}>
        {tier.name}
      </div>
      <div style={{ color: T.fg4, fontSize: 9, marginTop: 1 }}>{tier.desc}</div>
      <div style={{
        color: canAfford ? T.bYellow : T.bg4,
        fontSize: 10,
        marginTop: 4,
        fontFamily: T.mono,
        fontWeight: 700,
      }}>
        ${fmt(tier.cost)}
      </div>
    </button>
  );
}

function ActiveBonuses({ bonuses }) {
  const entries = Object.entries(bonuses).filter(([, v]) => v > 0);
  if (entries.length === 0) return null;

  return (
    <div style={{
      marginTop: 8,
      padding: "6px 10px",
      background: "rgba(0,0,0,0.3)",
      borderRadius: T.radiusSm,
      border: `1px solid ${T.bg2}`,
    }}>
      <div style={{ color: T.fg4, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
        Active Research Bonuses
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {entries.map(([key, val]) => (
          <span key={key} style={{
            color: T.bGreen,
            fontSize: 10,
            fontFamily: T.mono,
            background: "rgba(184,187,38,0.1)",
            padding: "1px 6px",
            borderRadius: 4,
          }}>
            {key}: +{key === "agents" || key === "slots" ? val : (val * 100).toFixed(0) + "%"}
          </span>
        ))}
      </div>
    </div>
  );
}
