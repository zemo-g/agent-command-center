import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore.js'

export default function LogFeed() {
  const log = useGameStore(s => s.log) || []
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log.length])

  function formatTime(ts) {
    const d = new Date(ts)
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="footer">
      <div className="log-feed">
        {log.slice(-50).map((entry, i) => (
          <div key={i} className={`log-entry ${entry.type}`}>
            <span className="log-time">{formatTime(entry.time)}</span>
            <span className="log-text">{entry.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
