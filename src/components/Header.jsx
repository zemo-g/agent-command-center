import { useGameStore } from '../store/gameStore.js'
import { getCurrentTier } from '../data/tiers.js'

export default function Header() {
  const resources = useGameStore(s => s.resources)
  const totalCreditsEarned = useGameStore(s => s.totalCreditsEarned)
  const prestigeLevel = useGameStore(s => s.prestigeLevel)
  const soundEnabled = useGameStore(s => s.soundEnabled)
  const toggleSound = useGameStore(s => s.toggleSound)
  const saveGame = useGameStore(s => s.saveGame)
  const tempBoost = useGameStore(s => s.tempBoost)
  const rates = useGameStore(s => s.getProductionRates)()
  const caps = useGameStore(s => s.getResourceCaps)()
  const fmt = useGameStore(s => s.fmt)
  const tier = getCurrentTier(totalCreditsEarned)

  const boostActive = tempBoost && tempBoost.until > Date.now()

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">Nexus Command</div>
        <div className="tier-badge" style={{ borderColor: tier.color, color: tier.color }}>
          <span>{tier.icon}</span>
          <span>{tier.name}</span>
        </div>
        {prestigeLevel > 0 && (
          <div className="prestige-badge">P{prestigeLevel}</div>
        )}
        {boostActive && (
          <div className="boost-indicator active">
            BOOST x{tempBoost.multiplier}
          </div>
        )}
      </div>

      <div className="header-resources">
        <div className="resource-item resource-energy tooltip-wrapper">
          <span className="resource-icon">⚡</span>
          <span className="resource-value">{fmt(Math.floor(resources.energy))}</span>
          <span className="resource-rate">+{rates.energyPerSec.toFixed(1)}/s</span>
          <span className="resource-cap">/{fmt(caps.energy)}</span>
          <div className="tooltip">Energy — powers buildings &amp; missions</div>
        </div>

        <div className="resource-item resource-cycles tooltip-wrapper">
          <span className="resource-icon">◈</span>
          <span className="resource-value">{fmt(Math.floor(resources.cycles))}</span>
          <span className="resource-rate">+{rates.cyclesPerSec.toFixed(1)}/s</span>
          <span className="resource-cap">/{fmt(caps.cycles)}</span>
          <div className="tooltip">Compute Cycles — used for research &amp; missions</div>
        </div>

        <div className="resource-item resource-credits tooltip-wrapper">
          <span className="resource-icon">◇</span>
          <span className="resource-value">{fmt(Math.floor(resources.credits))}</span>
          <div className="tooltip">Credits — earned from missions, spent on buildings</div>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="btn btn-sm"
          onClick={toggleSound}
          title={soundEnabled ? 'Mute' : 'Unmute'}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
        <button className="btn btn-sm" onClick={saveGame} title="Save">
          💾
        </button>
      </div>
    </header>
  )
}
