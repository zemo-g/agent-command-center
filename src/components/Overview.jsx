import { useGameStore } from '../store/gameStore.js'
import { getCurrentTier, getNextTier, TIERS } from '../data/tiers.js'
import { fmtTime } from '../engine/GameEngine.js'

export default function Overview() {
  const state = useGameStore()
  const fmt = state.fmt
  const tier = getCurrentTier(state.totalCreditsEarned)
  const nextTier = getNextTier(state.totalCreditsEarned)
  const rates = state.getProductionRates()
  const agentCap = state.getAgentCap()
  const missionSlots = state.getMissionSlots()

  const idleAgents = state.agents.filter(a => a.status === 'idle').length
  const busyAgents = state.agents.filter(a => a.status === 'mission').length
  const progressPct = nextTier
    ? Math.min(100, (state.totalCreditsEarned / nextTier.creditsRequired) * 100)
    : 100

  return (
    <div className="panel">
      <div className="panel-title">Command Overview</div>

      {/* Tier progress */}
      <div className="tier-progress">
        <div className="tier-progress-header">
          <div className="tier-current" style={{ color: tier.color }}>
            {tier.icon} {tier.name}
          </div>
          {nextTier ? (
            <div className="tier-next">
              Next: {nextTier.name} at {fmt(nextTier.creditsRequired)} ◇ earned
            </div>
          ) : (
            <div className="tier-next text-magenta">MAX TIER — Prestige available</div>
          )}
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{
            width: `${progressPct}%`,
            background: `linear-gradient(90deg, ${tier.color}, ${nextTier?.color || '#ff00ff'})`,
          }} />
        </div>
        <div className="progress-label">
          <span>{fmt(state.totalCreditsEarned)} ◇ earned</span>
          <span>{nextTier ? `${fmt(nextTier.creditsRequired)} ◇ needed` : 'COMPLETE'}</span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="overview-grid">
        <div className="overview-stat">
          <div className="overview-stat-value text-amber">{rates.energyPerSec.toFixed(1)}</div>
          <div className="overview-stat-label">⚡ Energy/sec</div>
        </div>
        <div className="overview-stat">
          <div className="overview-stat-value text-cyan">{rates.cyclesPerSec.toFixed(1)}</div>
          <div className="overview-stat-label">◈ Cycles/sec</div>
        </div>
        <div className="overview-stat">
          <div className="overview-stat-value text-green">{fmt(state.resources.credits)}</div>
          <div className="overview-stat-label">◇ Credits</div>
        </div>
        <div className="overview-stat">
          <div className="overview-stat-value text-cyan">{state.agents.length}/{agentCap}</div>
          <div className="overview-stat-label">👤 Agents</div>
        </div>
        <div className="overview-stat">
          <div className="overview-stat-value text-purple">{state.activeMissions.length}/{missionSlots}</div>
          <div className="overview-stat-label">🎯 Active Missions</div>
        </div>
        <div className="overview-stat">
          <div className="overview-stat-value text-bright">{state.completedMissions.length}</div>
          <div className="overview-stat-label">Missions Completed</div>
        </div>
      </div>

      {/* Facility status */}
      <div className="panel-subtitle">Facility Status</div>
      <div className="overview-grid">
        <div className="overview-stat">
          <div className="overview-stat-value" style={{ fontSize: '18px', color: 'var(--green)' }}>
            {idleAgents} idle
          </div>
          <div className="overview-stat-label">{busyAgents} on mission</div>
        </div>
        <div className="overview-stat">
          <div className="overview-stat-value" style={{ fontSize: '18px' }}>
            {Object.values(state.buildings).filter(v => v > 0).length}
          </div>
          <div className="overview-stat-label">Buildings Active</div>
        </div>
        <div className="overview-stat">
          <div className="overview-stat-value" style={{ fontSize: '18px', color: 'var(--purple)' }}>
            {Object.values(state.research).reduce((s, r) => s + r.completed, 0)}
          </div>
          <div className="overview-stat-label">Research Done</div>
        </div>
        <div className="overview-stat">
          <div className="overview-stat-value" style={{ fontSize: '18px' }}>
            {fmtTime(state.stats.playTime)}
          </div>
          <div className="overview-stat-label">Play Time</div>
        </div>
      </div>

      {/* Tier roadmap */}
      <div className="panel-subtitle">Tier Roadmap</div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {TIERS.map(t => {
          const reached = state.totalCreditsEarned >= t.creditsRequired
          const current = t.level === tier.level
          return (
            <div key={t.level} style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius)',
              background: current ? 'rgba(0,240,255,0.08)' : 'var(--bg-card)',
              border: `1px solid ${current ? t.color : reached ? 'var(--green-dim)' : 'var(--border-dim)'}`,
              opacity: reached ? 1 : 0.4,
              flex: '1 1 auto',
              minWidth: '120px',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '1px', color: t.color }}>
                {t.icon} {t.name}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
                {t.creditsRequired === 0 ? 'Start' : `${fmt(t.creditsRequired)} ◇`}
              </div>
              {reached && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--green)', marginTop: '2px' }}>UNLOCKED</div>}
            </div>
          )
        })}
      </div>

      {/* Prestige section */}
      {tier.level >= 5 && (
        <div style={{ marginTop: 'var(--gap-lg)', textAlign: 'center' }}>
          <div className="panel-subtitle" style={{ color: 'var(--magenta)' }}>Prestige Available</div>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '12px' }}>
            Reset all progress for a permanent x{((state.prestigeLevel + 1) * 0.5 + 1).toFixed(1)} production bonus.
          </p>
          <button className="btn btn-primary" onClick={() => state.setPrestigeModal(true)}>
            PRESTIGE
          </button>
        </div>
      )}
    </div>
  )
}
