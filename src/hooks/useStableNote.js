import { useEffect, useRef, useState } from 'react'
import { frequencyToNote } from '../lib/pitch.js'

// How many consecutive stable-pitch frames (~60fps) before a heard note
// counts as an answer. Filters out attack transients and octave blips.
const STABLE_FRAMES = 6

// Turns a raw detected pitch into a stable "answer": once the same note+octave
// has been sustained for STABLE_FRAMES consecutive frames, onStableNote fires.
// Returns the live { note, octave, cents } for display (or null when silent).
export function useStableNote(pitch, onStableNote) {
  const [heard, setHeard] = useState(null)
  const stableRef = useRef({ note: null, octave: null, count: 0 })

  useEffect(() => {
    if (!pitch) {
      stableRef.current = { note: null, octave: null, count: 0 }
      setHeard(null)
      return
    }

    const { note, octave, cents } = frequencyToNote(pitch.frequency)
    setHeard({ note, octave, cents })

    const s = stableRef.current
    if (s.note === note && s.octave === octave) {
      s.count += 1
    } else {
      stableRef.current = { note, octave, count: 1 }
    }

    if (stableRef.current.count === STABLE_FRAMES) {
      onStableNote(note, octave)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pitch])

  return heard
}
