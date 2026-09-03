import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import Fretboard from './Fretboard.jsx'
import Controls, { GROUPS } from './Controls.jsx'
import VuMeter from './VuMeter.jsx'
import { ALL_STRING_INDICES, cellsForStrings, noteAt, octaveAt, randomChoice } from '../lib/fretboard.js'
import { usePitchDetector } from '../hooks/usePitchDetector.js'
import { useStableNote } from '../hooks/useStableNote.js'

const DURATIONS = [15, 30, 60, 120]
const DEFAULT_DURATION = 30
const NEXT_NOTE_DELAY_MS = 120 // brief green flash before the next target appears
const WRONG_FLASH_MS = 350

export default function ChallengeMode() {
  const [phase, setPhase] = useState('setup') // 'setup' | 'running' | 'done'
  const [duration, setDuration] = useState(DEFAULT_DURATION)

  const [mode, setMode] = useState('all')
  const [singleString, setSingleString] = useState(5)
  const [group, setGroup] = useState(GROUPS[0].indices)

  const [targetNote, setTargetNote] = useState(null)
  const [targetOctave, setTargetOctave] = useState(null)
  const [cellState, setCellState] = useState({})
  const [locked, setLocked] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState({ correct: 0, attempts: 0 })
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [timeLeftMs, setTimeLeftMs] = useState(duration * 1000)
  const [result, setResult] = useState(null) // { correct, attempts, avgMs, notesPerMinute, bestStreak }

  const { listening, error: micError, pitch, start: startListening, stop: stopListening, getAnalyser } = usePitchDetector()

  const deadlineRef = useRef(0)
  const noteStartRef = useRef(0)
  const noteTimesRef = useRef({ sum: 0, count: 0 })
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  // Mirrors of score/bestStreak state, kept in sync so the countdown's
  // interval callback (set up once per run) always reads live values
  // instead of whatever was current when the interval was created.
  const scoreRef = useRef({ correct: 0, attempts: 0 })
  const bestStreakRef = useRef(0)

  const activeStrings = useMemo(() => {
    if (mode === 'single') return new Set([singleString])
    if (mode === 'group') return new Set(group)
    return new Set(ALL_STRING_INDICES)
  }, [mode, singleString, group])

  const scopeCells = useMemo(() => cellsForStrings([...activeStrings]), [activeStrings])

  const pickTarget = useCallback(() => {
    const cell = randomChoice(scopeCells)
    setTargetNote(noteAt(cell.stringIndex, cell.fret))
    setTargetOctave(octaveAt(cell.stringIndex, cell.fret))
    setCellState({})
    setLocked(false)
    setFeedback(null)
    noteStartRef.current = performance.now()
  }, [scopeCells])

  function finish() {
    setPhase('done')
    setLocked(true)
    const totals = noteTimesRef.current
    const { correct, attempts } = scoreRef.current
    setResult({
      correct,
      attempts,
      avgMs: totals.count > 0 ? totals.sum / totals.count : null,
      notesPerMinute: correct / (duration / 60),
      bestStreak: bestStreakRef.current,
    })
  }

  function startChallenge() {
    scoreRef.current = { correct: 0, attempts: 0 }
    bestStreakRef.current = 0
    setScore(scoreRef.current)
    setStreak(0)
    setBestStreak(0)
    setResult(null)
    noteTimesRef.current = { sum: 0, count: 0 }
    deadlineRef.current = performance.now() + duration * 1000
    setTimeLeftMs(duration * 1000)
    setPhase('running')
    pickTarget()
  }

  function backToSetup() {
    setPhase('setup')
  }

  // Countdown ticker.
  useEffect(() => {
    if (phase !== 'running') return
    const id = setInterval(() => {
      const remaining = deadlineRef.current - performance.now()
      if (remaining <= 0) {
        setTimeLeftMs(0)
        clearInterval(id)
        finish()
      } else {
        setTimeLeftMs(remaining)
      }
    }, 100)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function recordCorrect() {
    const elapsed = performance.now() - noteStartRef.current
    const totals = noteTimesRef.current
    totals.sum += elapsed
    totals.count += 1
    setStreak((n) => {
      const next = n + 1
      if (next > bestStreakRef.current) {
        bestStreakRef.current = next
        setBestStreak(next)
      }
      return next
    })
  }

  function submitAnswer(isCorrect) {
    if (phaseRef.current !== 'running' || locked || targetNote === null) return false
    scoreRef.current = {
      correct: scoreRef.current.correct + (isCorrect ? 1 : 0),
      attempts: scoreRef.current.attempts + 1,
    }
    setScore(scoreRef.current)
    if (isCorrect) {
      recordCorrect()
    } else {
      setStreak(0)
    }
    return true
  }

  function handleHeardNote(note, octave) {
    const isCorrect = note === targetNote && octave === targetOctave
    if (!submitAnswer(isCorrect)) return

    if (isCorrect) {
      setFeedback(null)
      setCellState({})
      setLocked(true)
      setTimeout(() => phaseRef.current === 'running' && pickTarget(), NEXT_NOTE_DELAY_MS)
    } else {
      setFeedback(`Heard ${note}${octave} — try again`)
      setTimeout(() => setFeedback(null), 700)
    }
  }

  const heard = useStableNote(pitch, handleHeardNote)

  function handleCellClick(stringIndex, fret) {
    const clickedNote = noteAt(stringIndex, fret)
    const clickedOctave = octaveAt(stringIndex, fret)
    const isCorrect = clickedNote === targetNote && clickedOctave === targetOctave
    if (!submitAnswer(isCorrect)) return

    const key = `${stringIndex}-${fret}`
    if (isCorrect) {
      setCellState({ [key]: 'correct' })
      setLocked(true)
      setTimeout(() => phaseRef.current === 'running' && pickTarget(), NEXT_NOTE_DELAY_MS)
    } else {
      setCellState((cs) => ({ ...cs, [key]: 'wrong' }))
      setTimeout(() => {
        setCellState((cs) => {
          const next = { ...cs }
          delete next[key]
          return next
        })
      }, WRONG_FLASH_MS)
    }
  }

  const accuracy = score.attempts > 0 ? Math.round((score.correct / score.attempts) * 100) : 0
  const secondsLeft = Math.ceil(timeLeftMs / 1000)
  const formatSeconds = (ms) => `${(ms / 1000).toFixed(2)}s`

  if (phase === 'setup') {
    return (
      <div className="challenge-setup">
        <Controls
          mode={mode}
          setMode={setMode}
          singleString={singleString}
          setSingleString={setSingleString}
          group={group}
          setGroup={setGroup}
        />

        <div className="duration-row">
          <span className="duration-label">Time:</span>
          {DURATIONS.map((d) => (
            <button
              key={d}
              className={duration === d ? 'chip active' : 'chip'}
              onClick={() => setDuration(d)}
            >
              {d}s
            </button>
          ))}
          <input
            type="number"
            className="duration-input"
            min="5"
            max="600"
            value={duration}
            onChange={(e) => setDuration(Math.max(5, Math.min(600, Number(e.target.value) || DEFAULT_DURATION)))}
          />
        </div>

        <div className="mic-row">
          <button className="mic-btn" onClick={listening ? stopListening : startListening}>
            {listening ? '⏹ Stop listening' : '🎤 Start listening'}
          </button>
          {micError && <span className="mic-error">{micError}</span>}
          <VuMeter getAnalyser={getAnalyser} active={listening} />
        </div>

        <button className="start-btn" onClick={startChallenge}>Start Challenge</button>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="challenge-results">
        <h2>Time's up!</h2>
        <div className="result-grid">
          <div className="result-stat">
            <span className="result-value">{result.avgMs === null ? '—' : formatSeconds(result.avgMs)}</span>
            <span className="result-label">Avg time / note</span>
          </div>
          <div className="result-stat">
            <span className="result-value">{result.correct}</span>
            <span className="result-label">Notes correct</span>
          </div>
          <div className="result-stat">
            <span className="result-value">{result.notesPerMinute.toFixed(1)}</span>
            <span className="result-label">Notes / min</span>
          </div>
          <div className="result-stat">
            <span className="result-value">{result.attempts > 0 ? Math.round((result.correct / result.attempts) * 100) : 0}%</span>
            <span className="result-label">Accuracy</span>
          </div>
          <div className="result-stat">
            <span className="result-value">{result.bestStreak}</span>
            <span className="result-label">Best streak</span>
          </div>
        </div>
        <div className="challenge-actions">
          <button className="start-btn" onClick={startChallenge}>Try again</button>
          <button className="secondary-btn" onClick={backToSetup}>Change settings</button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="challenge-run-header">
        <span className={secondsLeft <= 5 ? 'countdown low' : 'countdown'}>{secondsLeft}s</span>
        <span>Score: {score.correct}/{score.attempts}</span>
        <span>Accuracy: {accuracy}%</span>
        <span>Streak: {streak}</span>
        <button className="secondary-btn small" onClick={backToSetup}>Cancel</button>
      </div>

      {listening && (
        <div className="mic-row">
          <VuMeter getAnalyser={getAnalyser} active={listening} />
          <span className="heard-note">
            {heard ? `Hearing: ${heard.note}${heard.octave} (${heard.cents > 0 ? '+' : ''}${heard.cents}¢)` : 'Listening…'}
          </span>
        </div>
      )}

      <div className="prompt">
        Find: <span className="target-note">{targetNote}{targetOctave}</span>
        {feedback && <span className="feedback-msg">{feedback}</span>}
      </div>

      <Fretboard activeStrings={activeStrings} cellState={cellState} onCellClick={handleCellClick} />
    </>
  )
}
