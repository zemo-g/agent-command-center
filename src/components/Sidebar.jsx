import { useGameStore } from '../store/gameStore.js'
import { MISSIONS } from '../data/missions.js'
import { RESEARCH_TRACKS } from '../data/research.js'
import { fmtTime } from '../engine/GameEngine.js'

export default function Sidebar() {
  const state = useGameStore()
  const fmt = state.fmt
  const activeEvent = state.activeEvent
  const eventVisible = activeEvent && activeEvent.expiresAt > Date.now()

  return (
    <aside className="sidebar">
      {/* Active Event */}
      {eventVisible && (
        <div className="sidebar-section">
          <div className="sidebar-title">Event</div>
          <div className={`event-banner ${activeEvent.type}`}>
            <span>{activeEvent.icon}</span>
            <span>{activeEvent.name}</span>
          </div>
        </div>
      )}

      {/* Active Boosts */}
      {(state.tempBoost?.until > Date.now() || state.missionBoost?.until > Date.now()) && (
        <div className="sidebar-section">
          <div className="sidebar-title">Active Boosts</div>
          {state.tempBoost?.until > Date.now() && (
            <div className="boost-indicator active" style={{ marginBottom: '4px' }}>
              ⚡ Production x{state.tempBoost.multiplier} — {Math.ceil((state.tempBoost.until - Date.now()) / 1000)}s
            </div>
          )}
          {state.missionBoost?.until > Date.now() && (
            <div className="boost-indicator active">
              🎯 Mission speed x{state.missionBoost.speedMultiplier} — {Math.ceil((state.missionBoost.until - Date.now()) / 1000)}s
            </div>
          )}
        </div>
      )}

      {/* Active Missions */}
      <div className="sidebar-section">
        <div className="sidebar-title">
          Active Ops ({state.activeMissions.length}/{state.getMissionSlots()})
        </div>
        {state.activeMissions.length === 0 ? (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
            No active operations
          </div>
        ) : (
          state.activeMissions.map((am, i) => {
            const mission = MISSIONS.find(m => m.id === am.missionId)
            if (!mission) return null
            const pct = (am.progress / am.duration) * 100
            const remaining = am.duration - am.progress
            return (
              <div key={i} className="active-mission">
                <div className="active-mission-name">
                  <span>{mission.icon} {mission.name}</span>
                  <span className="active-mission-time">{fmtTime(remaining)}</span>
                </div>
                <div className="progress-bar" style={{ height: '3px' }}>
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Active Research */}
      <div className="sidebar-section">
        <div className="sidebar-title">Research</div>
        {Object.entries(state.research).map(([trackId, trackState]) => {
          const track = RESEARCH_TRACKS[trackId]
          if (!track) return null
          if (trackState.active) {
            const pct = (trackState.active.progress / trackState.active.duration) * 100
            const remaining = trackState.active.duration - trackState.active.progress
            return (
              <div key={trackId} className="active-mission" style={{ borderColor: track.color + '22' }}>
                <div className="active-mission-name">
                  <span>{track.icon} {track.tiers[trackState.active.tier]?.name}</span>
                  <span className="active-mission-time">{fmtTime(remaining)}</span>
                </div>
                <div className="progress-bar progress-bar-purple" style={{ height: '3px' }}>
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          }
          return (
            <div key={trackId} style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px',
              color: trackState.completed >= track.tiers.length ? track.color : 'var(--text-muted)',
              marginBottom: '2px', display: 'flex', justifyContent: 'space-between',
            }}>
              <span>{track.icon} {track.name}</span>
              <span>{trackState.completed}/{track.tiers.length}</span>
            </div>
          )
        })}
      </div>

      {/* Agents summary */}
      <div className="sidebar-section">
        <div className="sidebar-title">Crew Status</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {state.agents.slice(0, 8).map(agent => (
            <div key={agent.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontFamily: 'var(--font-mono)', fontSize: '10px',
            }}>
              <span style={{ color: 'var(--text-base)' }}>{agent.name}</span>
              <span style={{
                color: agent.status === 'idle' ? 'var(--green)' :
                       agent.status === 'mission' ? 'var(--cyan)' : 'var(--red)',
              }}>
                L{agent.level} {agent.status === 'idle' ? '●' : agent.status === 'mission' ? '▶' : '✕'}
              </span>
            </div>
          ))}
          {state.agents.length > 8 && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
              +{state.agents.length - 8} more...
            </div>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="sidebar-section" style={{ marginTop: 'auto' }}>
        <div className="sidebar-title">Stats</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)' }}>Play time</span>
            <span style={{ color: 'var(--text-base)' }}>{fmtTime(state.stats.playTime)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)' }}>Total ◇ earned</span>
            <span style={{ color: 'var(--green)' }}>{fmt(state.totalCreditsEarned)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)' }}>Events</span>
            <span style={{ color: 'var(--text-base)' }}>{state.stats.totalEventsHandled || 0}</span>
          </div>
          {state.prestigeLevel > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>Prestige</span>
              <span style={{ color: 'var(--magenta)' }}>x{(1 + state.prestigeLevel * 0.5).toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
