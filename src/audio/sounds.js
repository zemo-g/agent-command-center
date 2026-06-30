// Synthesized audio using Web Audio API — no external files needed

let audioCtx = null

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

function playTone(freq, duration, type = 'sine', volume = 0.12, detune = 0) {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    osc.detune.value = detune
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch (e) {
    // Audio not available, silently fail
  }
}

export function playClick() {
  playTone(800, 0.06, 'square', 0.08)
}

export function playBuild() {
  playTone(220, 0.15, 'sawtooth', 0.1)
  setTimeout(() => playTone(330, 0.15, 'sawtooth', 0.1), 80)
  setTimeout(() => playTone(440, 0.2, 'sawtooth', 0.08), 160)
}

export function playUpgrade() {
  playTone(440, 0.1, 'sine', 0.1)
  setTimeout(() => playTone(554, 0.1, 'sine', 0.1), 70)
  setTimeout(() => playTone(659, 0.15, 'sine', 0.12), 140)
  setTimeout(() => playTone(880, 0.25, 'sine', 0.1), 210)
}

export function playResearchComplete() {
  const notes = [523, 659, 784, 1047]
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.2, 'sine', 0.1), i * 100)
  })
}

export function playMissionComplete() {
  playTone(392, 0.15, 'square', 0.08)
  setTimeout(() => playTone(494, 0.15, 'square', 0.08), 100)
  setTimeout(() => playTone(587, 0.15, 'square', 0.08), 200)
  setTimeout(() => playTone(784, 0.3, 'square', 0.1), 300)
}

export function playMissionStart() {
  playTone(300, 0.1, 'sawtooth', 0.06)
  setTimeout(() => playTone(400, 0.15, 'sawtooth', 0.06), 80)
}

export function playEventGood() {
  playTone(600, 0.1, 'sine', 0.1)
  setTimeout(() => playTone(800, 0.15, 'sine', 0.1), 80)
}

export function playEventBad() {
  playTone(200, 0.2, 'sawtooth', 0.1, -10)
  setTimeout(() => playTone(150, 0.3, 'sawtooth', 0.08, 10), 100)
}

export function playError() {
  playTone(150, 0.15, 'square', 0.1)
  setTimeout(() => playTone(120, 0.2, 'square', 0.08), 100)
}

export function playTierUp() {
  const notes = [261, 329, 392, 523, 659, 784, 1047]
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.3 + i * 0.05, 'sine', 0.08 + i * 0.01), i * 80)
  })
}

export function playPrestige() {
  for (let i = 0; i < 12; i++) {
    setTimeout(() => {
      playTone(200 + i * 100, 0.4, 'sine', 0.06)
      playTone(200 + i * 100 + 5, 0.4, 'sine', 0.06)
    }, i * 60)
  }
}

export function playAgentRecruit() {
  playTone(500, 0.08, 'sine', 0.08)
  setTimeout(() => playTone(700, 0.12, 'sine', 0.1), 60)
}
