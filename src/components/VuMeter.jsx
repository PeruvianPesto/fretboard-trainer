import { useEffect, useRef } from 'react'

const BAR_COUNT = 14
const MIN_DB = -85 // silence floor
const MAX_DB = -25 // "loud" ceiling — where a bar maxes out

// A little spectrum wave that bounces with the live mic signal.
// It runs its own animation loop and pokes the DOM directly so the
// rest of the app doesn't re-render 60 times a second.
export default function VuMeter({ getAnalyser, active }) {
  const barsRef = useRef([])
  const rafRef = useRef(null)
  const levelsRef = useRef(new Float32Array(BAR_COUNT))

  useEffect(() => {
    if (!active) return

    let freqData = null
    // Log-spaced bin edges so low bars aren't all bass and highs aren't cramped.
    let edges = null

    const draw = () => {
      const analyser = getAnalyser?.()
      if (analyser) {
        if (!freqData || freqData.length !== analyser.frequencyBinCount) {
          freqData = new Uint8Array(analyser.frequencyBinCount)
          const n = freqData.length
          edges = Array.from({ length: BAR_COUNT + 1 }, (_, i) =>
            Math.floor(Math.pow(n, i / BAR_COUNT))
          )
        }
        analyser.getByteFrequencyData(freqData)

        for (let b = 0; b < BAR_COUNT; b++) {
          const start = edges[b]
          const end = Math.max(edges[b + 1], start + 1)
          let sum = 0
          for (let i = start; i < end; i++) sum += freqData[i]
          const avg = sum / (end - start) // 0..255
          const db = avg > 0 ? 20 * Math.log10(avg / 255) : MIN_DB
          let target = (db - MIN_DB) / (MAX_DB - MIN_DB)
          target = Math.max(0, Math.min(1, target))

          const prev = levelsRef.current[b]
          // Snap up fast, ease down slow — that's the "bounce".
          const next = target > prev ? target : prev + (target - prev) * 0.18
          levelsRef.current[b] = next

          const el = barsRef.current[b]
          if (el) el.style.transform = `scaleY(${Math.max(next, 0.04)})`
        }
      }
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      levelsRef.current.fill(0)
      barsRef.current.forEach((el) => {
        if (el) el.style.transform = 'scaleY(0.04)'
      })
    }
  }, [active, getAnalyser])

  if (!active) return null

  return (
    <div className="vu-meter" role="meter" aria-label="Microphone input level" aria-hidden="true">
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <span
          key={i}
          className="vu-bar"
          ref={(el) => {
            barsRef.current[i] = el
          }}
        />
      ))}
    </div>
  )
}
