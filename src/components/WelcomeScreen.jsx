import { useState } from 'react'
import { playClick, playTierUp } from '../audio/sounds.js'

export default function WelcomeScreen({ onStart }) {
  const [phase, setPhase] = useState(0)

  function advance() {
    playClick()
    if (phase < 2) {
      setPhase(phase + 1)
    } else {
      playTierUp()
      onStart()
    }
  }

  const lines = [
    {
      title: 'NEXUS COMMAND',
      subtitle: 'INITIALIZATION SEQUENCE',
      body: 'You have been appointed commander of a remote AI operations facility. Your mission: build infrastructure, recruit agents, and complete increasingly dangerous operations.',
    },
    {
      title: 'YOUR RESOURCES',
      subtitle: 'POWER • COMPUTE • CREDITS',
      body: '⚡ Energy powers your buildings and funds missions.\n◈ Compute Cycles fuel research and operations.\n◇ Credits are earned from missions and spent on infrastructure.\n\nBuild Fusion Reactors and Quantum Arrays to start generating.',
    },
    {
      title: 'YOUR OBJECTIVE',
      subtitle: 'RISE THROUGH THE TIERS',
      body: 'Progress from Outpost to Nexus by earning credits. Each tier unlocks new buildings, missions, and research. At the top, you can Prestige for permanent bonuses.\n\nYour agents ARIA and NOVA are standing by.',
    },
  ]

  const current = lines[phase]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-deep)',
    }}>
      <div className="starfield" />
      <div className="vignette" />
      <div className="scanlines" />

      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: '500px', width: '90%', textAlign: 'center',
        animation: 'modalIn 0.5s ease-out',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: phase === 0 ? '32px' : '20px',
          fontWeight: 700,
          letterSpacing: phase === 0 ? '8px' : '4px',
          color: 'var(--cyan)',
          textShadow: '0 0 30px rgba(0,240,255,0.3), 0 0 60px rgba(0,240,255,0.1)',
          marginBottom: '8px',
          transition: 'all 0.3s',
        }}>
          {current.title}
        </div>

        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          letterSpacing: '3px',
          color: 'var(--text-dim)',
          marginBottom: '32px',
        }}>
          {current.subtitle}
        </div>

        <div style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '15px',
          lineHeight: 1.7,
          color: 'var(--text-base)',
          marginBottom: '40px',
          whiteSpace: 'pre-line',
        }}>
          {current.body}
        </div>

        <button
          className="btn btn-primary"
          onClick={advance}
          style={{
            padding: '10px 32px',
            fontSize: '14px',
            letterSpacing: '2px',
          }}
        >
          {phase < 2 ? 'CONTINUE' : 'BEGIN OPERATIONS'}
        </button>

        {/* Progress dots */}
        <div style={{
          display: 'flex', gap: '8px', justifyContent: 'center',
          marginTop: '24px',
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: i === phase ? '24px' : '8px',
              height: '4px',
              borderRadius: '2px',
              background: i <= phase ? 'var(--cyan)' : 'var(--border-base)',
              transition: 'all 0.3s',
              boxShadow: i === phase ? '0 0 8px var(--cyan-dim)' : 'none',
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}
