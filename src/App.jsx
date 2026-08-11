import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import Fretboard from './components/Fretboard.jsx'
import Controls, { GROUPS } from './components/Controls.jsx'
import { cellsForStrings, cellsMatchingNote, noteAt, octaveAt, randomChoice } from './lib/fretboard.js'
import { frequencyToNote } from './lib/pitch.js'
import { usePitchDetector } from './hooks/usePitchDetector.js'

// How many consecutive stable-pitch frames (~60fps) before a heard note
// counts as an answer. Filters out attack transients and octave blips.
const STABLE_FRAMES = 6

export default function App() {
  const [mode, setMode] = useState('all') // 'single' | 'group' | 'all'
  const [singleString, setSingleString] = useState(5) // low E by default
  const [group, setGroup] = useState(GROUPS[0].indices)

  const [targetNote, setTargetNote] = useState(null)
  const [targetOctave, setTargetOctave] = useState(null)
  const [cellState, setCellState] = useState({}) // { "stringIndex-fret": 'correct' | 'wrong' }
  const [score, setScore] = useState({ correct: 0, attempts: 0 })
  const [streak, setStreak] = useState(0)
  const [locked, setLocked] = useState(false)
  const [heard, setHeard] = useState(null) // { note, octave, cents } — currently sung/played pitch
  const [feedback, setFeedback] = useState(null) // transient "heard the wrong note" message

  const { listening, error: micError, pitch, start: startListening, stop: stopListening } = usePitchDetector()
  const stableRef = useRef({ note: null, octave: null, count: 0 })

  const activeStrings = useMemo(() => {
    if (mode === 'single') return new Set([singleString])
    if (mode === 'group') return new Set(group)
    return new Set([0, 1, 2, 3, 4, 5])
  }, [mode, singleString, group])

  const scopeCells = useMemo(
    () => cellsForStrings([...activeStrings]),
    [activeStrings]
  )

  const pickTarget = useCallback(() => {
    const cell = randomChoice(scopeCells)
    setTargetNote(noteAt(cell.stringIndex, cell.fret))
    setTargetOctave(octaveAt(cell.stringIndex, cell.fret))
    setCellState({})
    setLocked(false)
    setFeedback(null)
    stableRef.current = { note: null, octave: null, count: 0 }
  }, [scopeCells])

  // Re-pick whenever the practice scope changes.
  useEffect(() => {
    pickTarget()
    setScore({ correct: 0, attempts: 0 })
    setStreak(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, singleString, group])

  function handleHeardNote(note, octave) {
    if (locked || targetNote === null) return
    const isCorrect = note === targetNote && octave === targetOctave

    setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), attempts: s.attempts + 1 }))

    if (isCorrect) {
      setStreak((n) => n + 1)
      setFeedback(null)
      const matches = cellsMatchingNote(note, octave, [...activeStrings])
      const newState = {}
      matches.forEach(({ stringIndex, fret }) => {
        newState[`${stringIndex}-${fret}`] = 'correct'
      })
      setCellState(newState)
      setLocked(true)
      setTimeout(pickTarget, 600)
    } else {
      setStreak(0)
      setFeedback(`Heard ${note}${octave} — try again`)
      setTimeout(() => setFeedback(null), 700)
    }
  }

  // Watch the live detected pitch and turn a sustained, stable note into an answer.
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
      handleHeardNote(note, octave)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pitch])

  function handleCellClick(stringIndex, fret) {
    if (locked || targetNote === null) return
    const clickedNote = noteAt(stringIndex, fret)
    const clickedOctave = octaveAt(stringIndex, fret)
    const key = `${stringIndex}-${fret}`
    const isCorrect = clickedNote === targetNote && clickedOctave === targetOctave

    setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), attempts: s.attempts + 1 }))

    if (isCorrect) {
      setStreak((n) => n + 1)
      setCellState((cs) => ({ ...cs, [key]: 'correct' }))
      setLocked(true)
      setTimeout(pickTarget, 450)
    } else {
      setStreak(0)
      setCellState((cs) => ({ ...cs, [key]: 'wrong' }))
      setTimeout(() => {
        setCellState((cs) => {
          const next = { ...cs }
          delete next[key]
          return next
        })
      }, 350)
    }
  }

  const accuracy = score.attempts > 0 ? Math.round((score.correct / score.attempts) * 100) : 0

  return (
    <div className="app">
      <h1>Fretboard Trainer</h1>

      <Controls
        mode={mode}
        setMode={setMode}
        singleString={singleString}
        setSingleString={setSingleString}
        group={group}
        setGroup={setGroup}
      />

      <div className="mic-row">
        <button className="mic-btn" onClick={listening ? stopListening : startListening}>
          {listening ? '⏹ Stop listening' : '🎤 Start listening'}
        </button>
        {micError && <span className="mic-error">{micError}</span>}
        {listening && (
          <span className="heard-note">
            {heard ? `Hearing: ${heard.note}${heard.octave} (${heard.cents > 0 ? '+' : ''}${heard.cents}¢)` : 'Listening…'}
          </span>
        )}
      </div>

      <div className="prompt">
        Find: <span className="target-note">{targetNote}{targetOctave}</span>
        {feedback && <span className="feedback-msg">{feedback}</span>}
      </div>

      <Fretboard activeStrings={activeStrings} cellState={cellState} onCellClick={handleCellClick} />

      <div className="stats">
        <span>Score: {score.correct}/{score.attempts}</span>
        <span>Accuracy: {accuracy}%</span>
        <span>Streak: {streak}</span>
      </div>
    </div>
  )
}
