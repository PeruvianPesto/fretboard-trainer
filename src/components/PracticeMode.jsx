import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import Fretboard from './Fretboard.jsx'
import Controls, { GROUPS } from './Controls.jsx'
import { STRINGS, cellsForStrings, cellsMatchingNote, noteAt, octaveAt, randomChoice } from '../lib/fretboard.js'
import { usePitchDetector } from '../hooks/usePitchDetector.js'
import { useStableNote } from '../hooks/useStableNote.js'

function describeCell(stringIndex, fret) {
  const label = STRINGS[stringIndex].label
  return fret === 0 ? `open ${label} string` : `${label} string, fret ${fret}`
}

export default function PracticeMode() {
  const [mode, setMode] = useState('all') // 'single' | 'group' | 'all'
  const [singleString, setSingleString] = useState(5) // low E by default
  const [group, setGroup] = useState(GROUPS[0].indices)

  const [targetNote, setTargetNote] = useState(null)
  const [targetOctave, setTargetOctave] = useState(null)
  const [targetCell, setTargetCell] = useState(null) // { stringIndex, fret } — where the current target note actually lives
  const [cellState, setCellState] = useState({}) // { "stringIndex-fret": 'correct' | 'wrong' | 'target' }
  const [score, setScore] = useState({ correct: 0, attempts: 0 })
  const [streak, setStreak] = useState(0)
  const [locked, setLocked] = useState(false)
  const [wrongInfo, setWrongInfo] = useState(null) // { heardNote, heardOctave } — drives the wrong-answer popup
  const [elapsedMs, setElapsedMs] = useState(0) // stopwatch for the current note, resets on each correct answer
  const [avgMs, setAvgMs] = useState(null) // running average time-to-correct-answer

  const { listening, error: micError, pitch, start: startListening, stop: stopListening } = usePitchDetector()
  const startTimeRef = useRef(performance.now())
  const timeTotalsRef = useRef({ sum: 0, count: 0 })

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
    setTargetCell(cell)
    setCellState({})
    setLocked(false)
    setWrongInfo(null)
    startTimeRef.current = performance.now()
    setElapsedMs(0)
  }, [scopeCells])

  // Stopwatch for the current note — ticks until it's answered correctly.
  function recordCorrectTime() {
    const elapsed = performance.now() - startTimeRef.current
    setElapsedMs(elapsed)
    const totals = timeTotalsRef.current
    totals.sum += elapsed
    totals.count += 1
    setAvgMs(totals.sum / totals.count)
  }

  useEffect(() => {
    if (locked || targetNote === null) return
    const id = setInterval(() => setElapsedMs(performance.now() - startTimeRef.current), 100)
    return () => clearInterval(id)
  }, [locked, targetNote])

  // Re-pick whenever the practice scope changes.
  useEffect(() => {
    pickTarget()
    setScore({ correct: 0, attempts: 0 })
    setStreak(0)
    timeTotalsRef.current = { sum: 0, count: 0 }
    setAvgMs(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, singleString, group])

  function handleHeardNote(note, octave) {
    if (locked || targetNote === null) return
    const isCorrect = note === targetNote && octave === targetOctave

    setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), attempts: s.attempts + 1 }))

    if (isCorrect) {
      setStreak((n) => n + 1)
      recordCorrectTime()
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
      setLocked(true)
      setCellState({ [`${targetCell.stringIndex}-${targetCell.fret}`]: 'target' })
      setWrongInfo({ heardNote: note, heardOctave: octave })
    }
  }

  const heard = useStableNote(pitch, handleHeardNote)

  function handleCellClick(stringIndex, fret) {
    if (locked || targetNote === null) return
    const clickedNote = noteAt(stringIndex, fret)
    const clickedOctave = octaveAt(stringIndex, fret)
    const key = `${stringIndex}-${fret}`
    const isCorrect = clickedNote === targetNote && clickedOctave === targetOctave

    setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), attempts: s.attempts + 1 }))

    if (isCorrect) {
      setStreak((n) => n + 1)
      recordCorrectTime()
      setCellState((cs) => ({ ...cs, [key]: 'correct' }))
      setLocked(true)
      setTimeout(pickTarget, 450)
    } else {
      setStreak(0)
      setLocked(true)
      setCellState((cs) => ({
        ...cs,
        [key]: 'wrong',
        [`${targetCell.stringIndex}-${targetCell.fret}`]: 'target',
      }))
      setWrongInfo({ heardNote: clickedNote, heardOctave: clickedOctave })
    }
  }

  function dismissWrong() {
    setWrongInfo(null)
    pickTarget()
  }

  const accuracy = score.attempts > 0 ? Math.round((score.correct / score.attempts) * 100) : 0
  const formatSeconds = (ms) => `${(ms / 1000).toFixed(1)}s`

  return (
    <>
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
      </div>

      <Fretboard activeStrings={activeStrings} cellState={cellState} onCellClick={handleCellClick} />

      {wrongInfo && (
        <div className="wrong-overlay" onClick={dismissWrong}>
          <div className="wrong-panel">
            <div className="wrong-heard">
              You played <strong>{wrongInfo.heardNote}{wrongInfo.heardOctave}</strong>
            </div>
            <div className="wrong-target">
              The correct note was <strong>{targetNote}{targetOctave}</strong> — {targetCell && describeCell(targetCell.stringIndex, targetCell.fret)}
            </div>
            <div className="wrong-hint">Click anywhere to continue</div>
          </div>
        </div>
      )}

      <div className="stats">
        <span>Score: {score.correct}/{score.attempts}</span>
        <span>Accuracy: {accuracy}%</span>
        <span>Streak: {streak}</span>
        <span>Time: {formatSeconds(elapsedMs)}</span>
        <span>Avg: {avgMs === null ? '—' : formatSeconds(avgMs)}</span>
      </div>
    </>
  )
}
