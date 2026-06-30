import { useGameStore } from '../store/gameStore.js'
import { MISSIONS, getUnlockedMissionTier } from '../data/missions.js'
import { canStartMission } from '../engine/GameEngine.js'
import { fmtTime } from '../engine/GameEngine.js'

export default function Missions() {
  const state = useGameStore()
  const fmt = state.fmt
  const unlockedTier = getUnlockedMissionTier(state.completedMissions)
  const missionSlots = state.getMissionSlots()
  const slotsUsed = state.activeMissions.length
  const idleAgents = state.agents.filter(a => a.status === 'idle').length

  const tierColors = { 1: 'var(--green)', 2: 'var(--cyan)', 3: 'var(--amber)', 4: 'var(--magenta)' }

  return (
    <div className="panel">
      <div className="panel-title">Operations</div>
      <div style={{
        display: 'flex', gap: '20px', marginBottom: 'var(--gap-lg)',
        fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)',
      }}>
        <span>Mission Slots: <span className="text-cyan">{slotsUsed}/{missionSlots}</span></span>
        <span>Idle Agents: <span className="text-green">{idleAgents}</span></span>
        <span>Completed: <span className="text-bright">{state.completedMissions.length}</span></span>
      </div>

      {/* Active missions */}
      {state.activeMissions.length > 0 && (
        <>
          <div className="panel-subtitle" style={{ color: 'var(--cyan)' }}>Active Operations</div>
          <div className="mission-grid" style={{ marginBottom: 'var(--gap-lg)' }}>
            {state.activeMissions.map((am, i) => {
              const mission = MISSIONS.find(m => m.id === am.missionId)
              if (!mission) return null
              const pct = (am.progress / am.duration) * 100
              const remaining = am.duration - am.progress

              return (
                <div key={i} className="mission-card" style={{ borderColor: 'var(--cyan-dim)' }}>
                  <div className="mission-header">
                    <span className="mission-icon">{mission.icon}</span>
                    <span className="mission-name">{mission.name}</span>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="progress-label">
                      <span>{Math.floor(pct)}%</span>
                      <span>{fmtTime(remaining)}</span>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-dim)' }}>
                    {am.agentIds.length} agents deployed — +{fmt(mission.reward)} ◇ on complete
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Available missions by tier */}
      {[1, 2, 3, 4].map(tier => {
        const tierMissions = MISSIONS.filter(m => m.tier === tier)
        const isUnlocked = tier <= unlockedTier

        return (
          <div key={tier}>
            <div className="panel-subtitle" style={{ color: isUnlocked ? tierColors[tier] : 'var(--text-muted)' }}>
              Tier {tier} {!isUnlocked && '— LOCKED'}
              {tier > 1 && !isUnlocked && (
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', marginLeft: '8px' }}>
                  (complete 3 Tier {tier - 1} missions)
                </span>
              )}
            </div>
            <div className="mission-grid">
              {tierMissions.map(mission => {
                const check = canStartMission(state, mission.id)
                const timesCompleted = state.completedMissions.filter(m => m.missionId === mission.id).length
                const isActive = state.activeMissions.some(m => m.missionId === mission.id)

                return (
                  <div key={mission.id} className={`mission-card ${!isUnlocked ? 'locked' : ''}`}>
                    <div className="mission-header">
                      <span className="mission-icon">{mission.icon}</span>
                      <div>
                        <div className="mission-name">{mission.name}</div>
                        {timesCompleted > 0 && (
                          <div style={{
                            fontFamily: 'var(--font-mono)', fontSize: '9px',
                            color: 'var(--green)', marginTop: '2px',
                          }}>
                            Completed x{timesCompleted}
                          </div>
                        )}
                      </div>
                      <span className="mission-tier-badge" style={{
                        marginLeft: 'auto',
                        borderColor: tierColors[tier] + '44',
                        color: tierColors[tier],
                      }}>
                        T{tier}
                      </span>
                    </div>
                    <div className="mission-desc">{mission.description}</div>
                    <div className="mission-requirements">
                      <span className="mission-req agents">👤 {mission.agents}</span>
                      <span className="mission-req energy">⚡ {mission.energyCost}</span>
                      <span className="mission-req cycles">◈ {mission.cyclesCost}</span>
                      <span className="mission-req time">⏱ {fmtTime(mission.duration)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="mission-reward">+{fmt(mission.reward)} ◇</div>
                      {isUnlocked && !isActive && (
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={!check.ok}
                          onClick={() => state.doStartMission(mission.id)}
                          title={check.ok ? '' : check.reason}
                        >
                          Launch
                        </button>
                      )}
                      {isActive && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--cyan)' }}>
                          IN PROGRESS
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
