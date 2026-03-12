import { T } from "./styles/theme.js";
import { useGameLoop } from "./hooks/useGameLoop.js";
import { BUILDINGS, buildingCost, isBuildingUnlocked, PROJECTS, isProjectUnlocked, fmt } from "./engine/GameEngine.js";
import { StatBar } from "./components/StatBar.jsx";
import { BuildingCard } from "./components/BuildingCard.jsx";
import { ProjectCard } from "./components/ProjectCard.jsx";
import { LogFeed } from "./components/LogFeed.jsx";
import { RewardPanel } from "./components/RewardPanel.jsx";
import { ResearchPanel } from "./components/ResearchPanel.jsx";
import { ComputePanel } from "./components/ComputePanel.jsx";

export default function App() {
  const { state, derived, buy, start, prestige, research, spend, addLog, save, reset } = useGameLoop();
  const { mults, pBonus, lpt, canPrest, pThreshold, rpt, effectiveAgents } = derived;

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg0,
      color: T.fg1,
      fontFamily: T.display,
      padding: "16px",
      maxWidth: 1500,
      margin: "0 auto",
    }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=IBM+Plex+Mono:wght@400;600;700&display=swap"
        rel="stylesheet"
      />

      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{
          fontSize: 10,
          letterSpacing: 4,
          color: T.orange,
          textTransform: "uppercase",
          marginBottom: 2,
        }}>
          Karpathy Protocol
        </div>
        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          color: T.fg1,
          margin: 0,
          letterSpacing: 2,
        }}>
          AGENT COMMAND CENTER
        </h1>
        <div style={{ fontSize: 10, color: T.bg4, marginTop: 2 }}>
          You direct. They build. Ship everything.
          {state.prestigeLevel > 0 && (
            <span style={{ color: T.bPurple, marginLeft: 8 }}>
              Prestige {state.prestigeLevel} ({pBonus.toFixed(1)}x)
            </span>
          )}
        </div>
      </div>

      {/* STATS ROW */}
      <div style={{
        display: "flex",
        justifyContent: "space-around",
        flexWrap: "wrap",
        background: "rgba(60,56,54,0.4)",
        borderRadius: 10,
        padding: "10px 8px",
        marginBottom: 14,
        border: `1px solid ${T.bg2}`,
        gap: 4,
      }}>
        <StatBar label="Funds" value={"$" + fmt(state.funds)} icon={"\u{1F4B0}"} />
        <StatBar label="Agents" value={effectiveAgents} icon={"\u{1F916}"} />
        <StatBar label="Lines/s" value={fmt(lpt * 2)} icon={"\u26A1"} />
        <StatBar label="Shipped" value={state.projectsShipped} icon={"\u{1F680}"} />
        <StatBar label="Lines" value={fmt(state.linesWritten)} icon={"\u{1F4DD}"} />
        <StatBar label="Bugs" value={fmt(state.bugsSquashed)} icon={"\u{1F41B}"} />
        <StatBar label="Slots" value={`${state.activeProjects.length}/${mults.maxSlots}`} icon={"\u{1F4CB}"} />
        <StatBar label="R&D/s" value={fmt(rpt * 2)} icon={"\u{1F52C}"} color={T.bGreen} />
      </div>

      {/* MAIN GRID — 2x2 on wide, stacks on narrow */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>

        {/* COL 1: BUILDINGS */}
        <div>
          <SectionHeader color={T.orange} label="Infrastructure" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.entries(BUILDINGS).map(([id, def]) => {
              const locked = !isBuildingUnlocked(id, state);
              return (
                <BuildingCard
                  key={id}
                  id={id}
                  def={def}
                  level={state.buildings[id]}
                  cost={buildingCost(def, state.buildings[id])}
                  funds={state.funds}
                  locked={locked}
                  onBuy={() => buy(id)}
                />
              );
            })}
          </div>
        </div>

        {/* COL 2: PROJECTS */}
        <div>
          <SectionHeader color={T.green} label="Projects" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {PROJECTS.map((proj) => {
              const active = state.activeProjects.find((a) => a.id === proj.id);
              const locked = !isProjectUnlocked(proj, state);
              const canStart = !locked && effectiveAgents >= proj.minAgents && !active && state.activeProjects.length < mults.maxSlots;
              return (
                <ProjectCard
                  key={proj.id}
                  proj={proj}
                  active={active}
                  onStart={() => start(proj.id)}
                  canStart={canStart}
                  locked={locked}
                />
              );
            })}
          </div>

          {/* PRESTIGE */}
          <button
            onClick={prestige}
            disabled={!canPrest}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: T.radius,
              border: `1px solid ${canPrest ? T.bPurple : T.bg2}`,
              background: canPrest
                ? `linear-gradient(135deg, ${T.bg2} 0%, rgba(211,134,155,0.2) 100%)`
                : "rgba(40,40,40,0.4)",
              color: canPrest ? T.bPurple : T.bg3,
              fontSize: 12,
              fontWeight: 700,
              cursor: canPrest ? "pointer" : "not-allowed",
              fontFamily: T.display,
              letterSpacing: 1,
            }}
          >
            PIVOT COMPANY (${fmt(pThreshold)} earned) +50% all output
          </button>
        </div>

        {/* COL 3: RESEARCH + REWARDS + LOG */}
        <div>
          <ResearchPanel
            research={state.research}
            researchBonuses={state.researchBonuses}
            funds={state.funds}
            rpt={rpt}
            onStart={research}
          />

          <div style={{ marginTop: 12 }}>
            <RewardPanel rewards={state.rewards} />
          </div>

          <div style={{ marginTop: 12 }}>
            <SectionHeader color={T.bAqua} label="Activity Feed" />
            <LogFeed log={state.log} />
          </div>

          {/* SAVE/RESET */}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <SmallButton onClick={save} label="Save" />
            <SmallButton onClick={() => { if (confirm("Reset all progress?")) reset(); }} label="Reset" danger />
          </div>
        </div>

        {/* COL 4: REAL COMPUTE */}
        <div>
          <SectionHeader color={T.bRed} label="Real Compute" />
          <ComputePanel
            funds={state.funds}
            onSpend={spend}
            addLog={addLog}
          />
        </div>
      </div>

      {/* FOOTER */}
      <div style={{
        textAlign: "center",
        marginTop: 16,
        fontSize: 9,
        color: T.bg3,
        letterSpacing: 1,
      }}>
        THE HUMAN DIRECTS &middot; THE AGENTS BUILD &middot; THE COMPANY SHIPS
      </div>
    </div>
  );
}

function SectionHeader({ color, label }) {
  return (
    <div style={{
      fontSize: 10,
      color,
      textTransform: "uppercase",
      letterSpacing: 2,
      marginBottom: 8,
      fontWeight: 700,
    }}>
      {label}
    </div>
  );
}

function SmallButton({ onClick, label, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: `1px solid ${T.bg2}`,
        borderRadius: T.radiusSm,
        color: T.fg4,
        fontSize: 10,
        padding: "4px 12px",
        cursor: "pointer",
        fontFamily: T.mono,
      }}
    >
      {label}
    </button>
  );
}
