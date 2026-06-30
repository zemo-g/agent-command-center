import { useEffect, useState } from 'react'
import { useGameStore } from './store/gameStore.js'
import Header from './components/Header.jsx'
import NavBar from './components/NavBar.jsx'
import Overview from './components/Overview.jsx'
import Buildings from './components/Buildings.jsx'
import Agents from './components/Agents.jsx'
import Research from './components/Research.jsx'
import Missions from './components/Missions.jsx'
import Sidebar from './components/Sidebar.jsx'
import LogFeed from './components/LogFeed.jsx'
import TierUpModal from './components/TierUpModal.jsx'
import WelcomeScreen from './components/WelcomeScreen.jsx'

const PANELS = {
  overview: Overview,
  buildings: Buildings,
  agents: Agents,
  research: Research,
  missions: Missions,
}

const SAVE_KEY = 'nexus_command_save'

export default function App() {
  const startLoop = useGameStore(s => s.startLoop)
  const stopLoop = useGameStore(s => s.stopLoop)
  const activeTab = useGameStore(s => s.activeTab)
  const showPrestigeModal = useGameStore(s => s.showPrestigeModal)
  const showTierUpModal = useGameStore(s => s.showTierUpModal)

  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem(SAVE_KEY)
  })

  useEffect(() => {
    if (!showWelcome) {
      startLoop()
      return () => stopLoop()
    }
  }, [showWelcome, startLoop, stopLoop])

  function handleStart() {
    setShowWelcome(false)
  }

  if (showWelcome) {
    return <WelcomeScreen onStart={handleStart} />
  }

  const Panel = PANELS[activeTab] || Overview

  return (
    <div className="app">
      {/* Background effects */}
      <div className="starfield" />
      <div className="vignette" />
      <div className="scanlines" />

      {/* Header */}
      <Header />

      {/* Main content */}
      <div className="main-content">
        <NavBar />
        <div className="viewport">
          <Panel />
        </div>
        <Sidebar />
      </div>

      {/* Log feed */}
      <LogFeed />

      {/* Modals */}
      {(showTierUpModal || showPrestigeModal) && <TierUpModal />}
    </div>
  )
}
