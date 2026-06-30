import { useGameStore } from '../store/gameStore.js'
import { TIERS } from '../data/tiers.js'

export default function TierUpModal() {
  const showTierUpModal = useGameStore(s => s.showTierUpModal)
  const newTierLevel = useGameStore(s => s.newTierLevel)
  const setTierUpModal = useGameStore(s => s.setTierUpModal)
  const showPrestigeModal = useGameStore(s => s.showPrestigeModal)
  const setPrestigeModal = useGameStore(s => s.setPrestigeModal)
  const doPrestige = useGameStore(s => s.doPrestige)
  const prestigeLevel = useGameStore(s => s.prestigeLevel)

  if (showPrestigeModal) {
    return (
      <div className="modal-overlay" onClick={() => setPrestigeModal(false)}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{
          borderColor: 'rgba(255, 0, 255, 0.4)',
          boxShadow: '0 0 60px rgba(255, 0, 255, 0.15)',
        }}>
          <div className="modal-title" style={{ color: 'var(--magenta)' }}>
            Prestige Reset
          </div>
          <div className="modal-body">
            <p>Reset all progress and start over with a permanent production bonus.</p>
            <div style={{
              margin: '16px 0', padding: '12px',
              background: 'rgba(255, 0, 255, 0.08)',
              borderRadius: 'var(--radius)',
              border: '1px solid rgba(255, 0, 255, 0.2)',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--magenta)' }}>
                x{((prestigeLevel + 1) * 0.5 + 1).toFixed(1)}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
                New production multiplier
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              This cannot be undone. You will keep your prestige level and cumulative stats.
            </p>
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setPrestigeModal(false)}>Cancel</button>
            <button className="btn btn-primary" style={{
              borderColor: 'rgba(255, 0, 255, 0.4)',
              color: 'var(--magenta)',
              background: 'linear-gradient(135deg, rgba(255,0,255,0.1), rgba(191,95,255,0.05))',
            }} onClick={doPrestige}>
              PRESTIGE
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!showTierUpModal || !newTierLevel) return null

  const tier = TIERS.find(t => t.level === newTierLevel)
  if (!tier) return null

  return (
    <div className="modal-overlay" onClick={() => setTierUpModal(false)}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{
        borderColor: tier.color + '66',
        boxShadow: `0 0 60px ${tier.color}22`,
      }}>
        <div style={{ textAlign: 'center', fontSize: '48px', marginBottom: '8px' }}>
          {tier.icon}
        </div>
        <div className="modal-title" style={{ color: tier.color }}>
          Tier Up!
        </div>
        <div className="modal-body">
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '20px',
            color: tier.color, marginBottom: '8px',
          }}>
            {tier.name}
          </div>
          <p>{tier.description}</p>
          <div style={{ marginTop: '12px', textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>
              NEW FEATURES:
            </div>
            {tier.features.map((f, i) => (
              <div key={i} style={{
                fontFamily: 'var(--font-mono)', fontSize: '12px',
                color: 'var(--text-base)', padding: '2px 0',
              }}>
                + {f}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => setTierUpModal(false)}>
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
