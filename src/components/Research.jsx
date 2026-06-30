import { useGameStore } from '../store/gameStore.js'
import { RESEARCH_TRACKS } from '../data/research.js'
import { fmtTime } from '../engine/GameEngine.js'

export default function Research() {
  const state = useGameStore()
  const fmt = state.fmt

  return (
    <div className="panel">
      <div className="panel-title">Research & Development</div>
      <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: 'var(--gap-lg)' }}>
        Invest compute cycles into permanent upgrades. Each track has 4 tiers of escalating power.
      </p>

      <div className="research-grid">
        {Object.entries(RESEARCH_TRACKS).map(([trackId, track]) => {
          const trackState = state.research[trackId] || { completed: 0, active: null }

          return (
            <div key={trackId} className="research-track" style={{ borderColor: track.color + '22' }}>
              <div className="research-track-header">
                <span className="research-track-icon">{track.icon}</span>
                <div>
                  <div className="research-track-name" style={{ color: track.color }}>{track.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-dim)' }}>
                    {track.description}
                  </div>
                </div>
              </div>

              <div className="research-tiers">
                {track.tiers.map((tier, i) => {
                  const isCompleted = i < trackState.completed
                  const isActive = trackState.active && trackState.active.tier === i
                  const isNext = i === trackState.completed && !trackState.active
                  const isLocked = i > trackState.completed

                  const canAfford = isNext && state.resources.cycles >= tier.cost

                  return (
                    <div key={i} className={`research-tier ${isCompleted ? 'completed' : isActive ? 'active' : isLocked ? 'locked' : ''}`}>
                      <div style={{ flex: 1 }}>
                        <div className="research-tier-name">
                          {isCompleted && '✓ '}{tier.name}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
                          {tier.desc}
                        </div>
                        {isActive && (
                          <div style={{ marginTop: '6px' }}>
                            <div className="progress-bar progress-bar-purple">
                              <div
                                className="progress-fill"
                                style={{ width: `${(trackState.active.progress / trackState.active.duration) * 100}%` }}
                              />
                            </div>
                            <div className="progress-label">
                              <span className="research-active">RESEARCHING</span>
                              <span>{fmtTime(trackState.active.duration - trackState.active.progress)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        {isCompleted && (
                          <span className="research-completed research-tier-status">DONE</span>
                        )}
                        {isActive && (
                          <span className="research-active research-tier-status">
                            {Math.floor((trackState.active.progress / trackState.active.duration) * 100)}%
                          </span>
                        )}
                        {isNext && (
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={!canAfford}
                            onClick={() => state.doStartResearch(trackId)}
                          >
                            {fmt(tier.cost)} ◈
                          </button>
                        )}
                        {isLocked && (
                          <span className="research-tier-status" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                            LOCKED
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Progress bar for track */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {track.tiers.map((_, i) => (
                    <div key={i} style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: '2px',
                      background: i < trackState.completed ? track.color : 'var(--bg-surface)',
                      border: `1px solid ${i < trackState.completed ? track.color + '66' : 'var(--border-dim)'}`,
                      transition: 'all 0.3s',
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
