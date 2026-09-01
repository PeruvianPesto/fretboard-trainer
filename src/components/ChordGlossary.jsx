import { useMemo, useState } from 'react'
import Fretboard from './Fretboard.jsx'
import {
  STRINGS,
  STRING_INDICES_LOW_TO_HIGH,
  NOTE_NAMES,
  pitchClassAt,
  noteAt,
} from '../lib/fretboard.js'
import { CHORD_SHAPES, intervalLabel } from '../lib/chordShapes.js'

const E_PITCH_CLASS = NOTE_NAMES.indexOf('E')

// Roots ordered by where the barre lands: F at fret 1 … E at fret 12. Fret 0 is
// deliberately skipped so every grip shown is fully fretted (E lives at fret 12).
const ROOTS = Array.from({ length: 12 }, (_, i) => {
  const fret = i + 1
  const pc = (E_PITCH_CLASS + fret) % 12
  return { fret, pc, name: NOTE_NAMES[pc] }
})

export default function ChordGlossary() {
  const [rootFret, setRootFret] = useState(3) // G
  const [shapeId, setShapeId] = useState('maj')

  const shape = CHORD_SHAPES.find((s) => s.id === shapeId)
  const root = ROOTS.find((r) => r.fret === rootFret)

  // One entry per sounding string, low-to-high, with its fret, note and degree.
  const tones = useMemo(
    () =>
      STRING_INDICES_LOW_TO_HIGH.filter((si) => shape.offsets[si] != null).map((si) => {
        const fret = rootFret + shape.offsets[si]
        const semis = pitchClassAt(si, fret) - root.pc
        return {
          stringIndex: si,
          fret,
          note: noteAt(si, fret),
          interval: intervalLabel(semis, { dim: shape.id === 'dim7' }),
        }
      }),
    [shape, rootFret, root]
  )

  const cellState = useMemo(() => {
    const cs = {}
    for (const t of tones) {
      cs[`${t.stringIndex}-${t.fret}`] = t.interval === 'R' ? 'root' : 'selected'
    }
    return cs
  }, [tones])

  const activeStrings = useMemo(() => new Set(tones.map((t) => t.stringIndex)), [tones])

  // Set keeps first-seen order, so this stays low-to-high.
  const uniqueNotes = useMemo(() => [...new Set(tones.map((t) => t.note))], [tones])

  return (
    <>
      <p className="chord-meta">
        Movable shapes with the root on the low E string. Barre the whole grip up or
        down the neck to change key — no open strings.
      </p>

      <div className="controls">
        <div className="mode-row">
          {ROOTS.map((r) => (
            <button
              key={r.fret}
              className={r.fret === rootFret ? 'chip active' : 'chip'}
              onClick={() => setRootFret(r.fret)}
            >
              {r.name}
            </button>
          ))}
        </div>
        <div className="sub-row">
          {CHORD_SHAPES.map((s) => (
            <button
              key={s.id}
              className={s.id === shapeId ? 'chip active' : 'chip'}
              onClick={() => setShapeId(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="prompt">
        <span className="target-note">{root.name} {shape.name}</span>
      </div>
      <div className="chord-meta">{shape.formula}  ·  barre at fret {rootFret}</div>

      <Fretboard activeStrings={activeStrings} cellState={cellState} onCellClick={() => {}} />

      <div className="chord-strings">
        {STRING_INDICES_LOW_TO_HIGH.map((si) => {
          const tone = tones.find((t) => t.stringIndex === si)
          return (
            <div key={si} className="chord-string">
              <span className="chord-string-label">{STRINGS[si].label}</span>
              <span className={tone ? 'chord-string-fret' : 'chord-string-fret muted'}>
                {tone ? tone.fret : '✕'}
              </span>
              <span className="chord-string-note">{tone ? tone.note : ''}</span>
              <span className="chord-string-interval">{tone ? tone.interval : ''}</span>
            </div>
          )
        })}
      </div>

      <div className="chord-notes">Notes: {uniqueNotes.join(' – ')}</div>
    </>
  )
}
