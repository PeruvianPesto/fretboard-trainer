import { useMemo, useState } from 'react'
import Fretboard from './Fretboard.jsx'
import { STRINGS, NOTE_NAMES, noteAt, octaveAt } from '../lib/fretboard.js'
import { detectChords } from '../lib/chords.js'

const ALL_STRINGS = new Set([0, 1, 2, 3, 4, 5])
// Standard chord-chart order: low E (string index 5) on the left.
const LOW_TO_HIGH = [5, 4, 3, 2, 1, 0]

export default function ChordCreator() {
  // { [stringIndex]: fret } — at most one note per string; a missing string is muted.
  const [selected, setSelected] = useState({})

  function handleCellClick(stringIndex, fret) {
    setSelected((sel) => {
      const next = { ...sel }
      if (next[stringIndex] === fret) delete next[stringIndex] // click the same note again to mute
      else next[stringIndex] = fret
      return next
    })
  }

  const cellState = useMemo(() => {
    const cs = {}
    for (const [stringIndex, fret] of Object.entries(selected)) {
      cs[`${stringIndex}-${fret}`] = 'selected'
    }
    return cs
  }, [selected])

  const voicing = useMemo(
    () =>
      LOW_TO_HIGH.filter((si) => selected[si] != null).map((si) => {
        const fret = selected[si]
        const note = noteAt(si, fret)
        const octave = octaveAt(si, fret)
        const pc = NOTE_NAMES.indexOf(note)
        return { stringIndex: si, fret, note, octave, pc, abs: octave * 12 + pc }
      }),
    [selected]
  )

  const byPitch = useMemo(() => [...voicing].sort((a, b) => a.abs - b.abs), [voicing])
  const bassPc = byPitch.length > 0 ? byPitch[0].pc : null

  const chords = useMemo(
    () => detectChords(voicing.map((v) => v.pc), bassPc),
    [voicing, bassPc]
  )

  const uniqueNotes = useMemo(() => {
    const seen = []
    for (const v of byPitch) {
      if (!seen.includes(v.note)) seen.push(v.note)
    }
    return seen
  }, [byPitch])

  const chordName = chords[0] || (voicing.length >= 2 ? 'No standard chord' : '—')

  return (
    <>
      <p className="chord-hint">
        Click a fret to place a note on that string. Click it again to mute the string.
      </p>

      <div className="prompt">
        Chord: <span className="target-note">{chordName}</span>
      </div>

      {chords.length > 1 && (
        <div className="chord-alts">also: {chords.slice(1).join('  ·  ')}</div>
      )}

      <Fretboard activeStrings={ALL_STRINGS} cellState={cellState} onCellClick={handleCellClick} />

      <div className="chord-strings">
        {LOW_TO_HIGH.map((si) => {
          const has = selected[si] != null
          const fret = selected[si]
          return (
            <div key={si} className="chord-string">
              <span className="chord-string-label">{STRINGS[si].label}</span>
              <span className={has ? 'chord-string-fret' : 'chord-string-fret muted'}>
                {!has ? '✕' : fret === 0 ? '○' : fret}
              </span>
              <span className="chord-string-note">{has ? noteAt(si, fret) : ''}</span>
            </div>
          )
        })}
      </div>

      <div className="chord-notes">
        {uniqueNotes.length > 0 ? `Notes: ${uniqueNotes.join(' – ')}` : 'No notes selected'}
      </div>

      <div className="challenge-actions">
        <button className="secondary-btn" onClick={() => setSelected({})}>Clear</button>
      </div>
    </>
  )
}
