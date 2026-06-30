import { useGameStore } from '../store/gameStore.js'

const TABS = [
  { id: 'overview', icon: '◎', label: 'CMD' },
  { id: 'buildings', icon: '🏗', label: 'BUILD' },
  { id: 'agents', icon: '👤', label: 'CREW' },
  { id: 'research', icon: '🔬', label: 'R&D' },
  { id: 'missions', icon: '🎯', label: 'OPS' },
]

export default function NavBar() {
  const activeTab = useGameStore(s => s.activeTab)
  const setTab = useGameStore(s => s.setTab)
  const activeMissions = useGameStore(s => s.activeMissions)

  return (
    <nav className="nav">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setTab(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          {tab.label}
          {tab.id === 'missions' && activeMissions.length > 0 && (
            <div className="notif-dot" />
          )}
        </button>
      ))}
    </nav>
  )
}
