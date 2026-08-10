import { useEffect, useMemo, useState, useCallback } from 'react'
import Fretboard from './components/Fretboard.jsx'
import Controls, { GROUPS } from './components/Controls.jsx'
import { cellsForStrings, noteAt, randomChoice } from './lib/fretboard.js'

export default function App() {
  const [mode, setMode] = useState('all') // 'single' | 'group' | 'all'
  const [singleString, setSingleString] = useState(5) // low E by default
  const [group, setGroup] = useState(GROUPS[0].indices)

  const [targetNote, setTargetNote] = useState(null)
  const [cellState, setCellState] = useState({}) // { "stringIndex-fret": 'correct' | 'wrong' }
  const [score, setScore] = useState({ correct: 0, attempts: 0 })
  const [streak, setStreak] = useState(0)
  const [locked, setLocked] = useState(false)

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
    setCellState({})
    setLocked(false)
  }, [scopeCells])

  // Re-pick whenever the practice scope changes.
  useEffect(() => {
    pickTarget()
    setScore({ correct: 0, attempts: 0 })
    setStreak(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, singleString, group])

  function handleCellClick(stringIndex, fret) {
    if (locked || targetNote === null) return
    const clickedNote = noteAt(stringIndex, fret)
    const key = `${stringIndex}-${fret}`
    const isCorrect = clickedNote === targetNote

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

      <div className="prompt">
        Find: <span className="target-note">{targetNote}</span>
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
