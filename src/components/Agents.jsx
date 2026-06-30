import { useGameStore } from '../store/gameStore.js'
import { getMissionById } from '../data/missions.js'

export default function Agents() {
  const state = useGameStore()
  const fmt = state.fmt
  const agentCap = state.getAgentCap()
  const recruitCost = state.getRecruitCost()
  const canRecruit = state.agents.length < agentCap && state.resources.credits >= recruitCost

  const idle = state.agents.filter(a => a.status === 'idle')
  const onMission = state.agents.filter(a => a.status === 'mission')
  const locked = state.agents.filter(a => a.status === 'locked')

  function xpForNextLevel(level) {
    return level * level * 50
  }

  return (
    <div className="panel">
      <div className="panel-title">Agent Roster</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--gap-lg)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>
          {state.agents.length} / {agentCap} agents
          <span style={{ margin: '0 8px', color: 'var(--border-base)' }}>|</span>
          <span className="text-green">{idle.length} idle</span>
          <span style={{ margin: '0 8px', color: 'var(--border-base)' }}>|</span>
          <span className="text-cyan">{onMission.length} deployed</span>
          {locked.length > 0 && (
            <>
              <span style={{ margin: '0 8px', color: 'var(--border-base)' }}>|</span>
              <span className="text-red">{locked.length} locked</span>
            </>
          )}
        </div>
        <button
          className="btn btn-primary btn-sm"
          disabled={!canRecruit}
          onClick={() => state.doRecruitAgent()}
        >
          Recruit — {fmt(recruitCost)} ◇
        </button>
      </div>

      {state.agents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <div className="empty-state-text">No agents recruited yet</div>
        </div>
      ) : (
        <div className="agent-grid">
          {state.agents.map(agent => {
            const xpNeeded = xpForNextLevel(agent.level)
            const xpPct = Math.min(100, (agent.xp / xpNeeded) * 100)
            const mission = agent.assignedTo ? getMissionById(agent.assignedTo) : null

            return (
              <div key={agent.id} className={`agent-card ${agent.status}`}>
                <div className="agent-name">{agent.name}</div>
                <div className="agent-info">
                  <span>LVL {agent.level}</span>
                  <span>{agent.xp} XP</span>
                </div>
                <div className={`agent-status ${agent.status}`}>
                  {agent.status === 'idle' && '● STANDBY'}
                  {agent.status === 'mission' && `▶ ${mission?.name || 'ON MISSION'}`}
                  {agent.status === 'locked' && '✕ LOCKED'}
                </div>
                <div className="agent-xp-bar">
                  <div className="agent-xp-fill" style={{ width: `${xpPct}%` }} />
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)',
                  marginTop: '2px',
                }}>
                  <span>{agent.xp}/{xpNeeded}</span>
                  <span>→ LVL {agent.level + 1}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Agent stats summary */}
      <div className="panel-subtitle">Squad Stats</div>
      <div className="overview-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
        <div className="overview-stat">
          <div className="overview-stat-value text-cyan" style={{ fontSize: '20px' }}>
            {state.agents.reduce((s, a) => s + a.level, 0)}
          </div>
          <div className="overview-stat-label">Total Levels</div>
        </div>
        <div className="overview-stat">
          <div className="overview-stat-value text-green" style={{ fontSize: '20px' }}>
            {Math.max(...state.agents.map(a => a.level))}
          </div>
          <div className="overview-stat-label">Highest Level</div>
        </div>
        <div className="overview-stat">
          <div className="overview-stat-value text-amber" style={{ fontSize: '20px' }}>
            {state.agents.reduce((s, a) => s + a.xp, 0)}
          </div>
          <div className="overview-stat-label">Total XP</div>
        </div>
      </div>
    </div>
  )
}
