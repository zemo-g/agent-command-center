import { useGameStore } from '../store/gameStore.js'
import { BUILDINGS, BUILDING_CATEGORIES, getBuildingCost } from '../data/buildings.js'
import { getCurrentTier } from '../data/tiers.js'

export default function Buildings() {
  const state = useGameStore()
  const fmt = state.fmt
  const tier = getCurrentTier(state.totalCreditsEarned)

  const categories = {}
  for (const [id, b] of Object.entries(BUILDINGS)) {
    const cat = b.category
    if (!categories[cat]) categories[cat] = []
    categories[cat].push({ id, ...b })
  }

  return (
    <div className="panel">
      <div className="panel-title">Infrastructure</div>
      <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: 'var(--gap-lg)' }}>
        Build and upgrade facilities to generate resources and expand your operation.
      </p>

      {Object.entries(categories).map(([catId, buildings]) => {
        const cat = BUILDING_CATEGORIES[catId]
        return (
          <div key={catId}>
            <div className="panel-subtitle" style={{ color: cat.color }}>{cat.name}</div>
            <div className="card-grid">
              {buildings.map(b => {
                const level = state.buildings[b.id] || 0
                const cost = getBuildingCost(b.id, level)
                const canAfford = state.resources.credits >= cost
                const isMaxed = level >= b.maxLevel
                const isLocked = tier.level < b.unlockTier

                return (
                  <div key={b.id} className={`card ${isLocked ? 'card-locked' : ''} ${isMaxed ? 'card-maxed' : ''}`}>
                    <div className="card-header">
                      <div className="card-icon" style={{
                        borderColor: level > 0 ? cat.color + '44' : 'var(--border-dim)',
                        boxShadow: level > 0 ? `0 0 8px ${cat.color}22` : 'none',
                      }}>
                        {b.icon}
                      </div>
                      <div>
                        <div className="card-title">{b.name}</div>
                        <div className="card-level">
                          {isLocked
                            ? `Unlocks at Tier ${b.unlockTier}`
                            : isMaxed
                              ? 'MAX LEVEL'
                              : `Level ${level}`}
                        </div>
                      </div>
                    </div>
                    <div className="card-desc">{b.description}</div>
                    {level > 0 && (
                      <div className="card-effect" style={{ color: cat.color }}>
                        {b.effectLabel(level)}
                      </div>
                    )}
                    {!isLocked && !isMaxed && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={!canAfford}
                          onClick={() => state.doBuyBuilding(b.id)}
                        >
                          {level === 0 ? 'Build' : 'Upgrade'}
                        </button>
                        <span className="btn-cost">{fmt(cost)} ◇</span>
                      </div>
                    )}
                    {isMaxed && !isLocked && (
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: cat.color,
                        textAlign: 'center',
                        padding: '4px',
                      }}>
                        {b.effectLabel(level)}
                      </div>
                    )}
                    {/* Level pips */}
                    {!isLocked && (
                      <div style={{
                        display: 'flex',
                        gap: '3px',
                        marginTop: '8px',
                        justifyContent: 'center',
                      }}>
                        {Array.from({ length: b.maxLevel }).map((_, i) => (
                          <div key={i} style={{
                            width: '8px',
                            height: '3px',
                            borderRadius: '1px',
                            background: i < level ? cat.color : 'var(--bg-surface)',
                            border: `1px solid ${i < level ? cat.color + '66' : 'var(--border-dim)'}`,
                            transition: 'all 0.3s',
                          }} />
                        ))}
                      </div>
                    )}
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
