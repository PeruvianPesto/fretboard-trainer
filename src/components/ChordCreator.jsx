import { useMemo, useState } from 'react'
import Fretboard from './Fretboard.jsx'
import {
  STRINGS,
  ALL_STRING_INDICES,
  STRING_INDICES_LOW_TO_HIGH,
  noteAt,
  pitchClassAt,
  absoluteSemitoneAt,
} from '../lib/fretboard.js'
import { detectChords } from '../lib/chords.js'

const ALL_STRINGS = new Set(ALL_STRING_INDICES)

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
      STRING_INDICES_LOW_TO_HIGH.filter((si) => selected[si] != null).map((si) => {
        const fret = selected[si]
        return {
          stringIndex: si,
          fret,
          note: noteAt(si, fret),
          pc: pitchClassAt(si, fret),
          abs: absoluteSemitoneAt(si, fret),
        }
      }),
    [selected]
  )

  const byPitch = useMemo(() => [...voicing].sort((a, b) => a.abs - b.abs), [voicing])
  const bassPc = byPitch.length > 0 ? byPitch[0].pc : null

  const chords = useMemo(
    () => detectChords(voicing.map((v) => v.pc), bassPc),
    [voicing, bassPc]
  )

  // Set preserves first-seen order, so this stays low-to-high.
  const uniqueNotes = useMemo(() => [...new Set(byPitch.map((v) => v.note))], [byPitch])

  // detectChords always returns a name for a 1+ note voicing (a lone note comes
  // back as "C (single note)"), so the fallbacks below only cover 0 notes and
  // a genuine 2+ note voicing that matches no known shape.
  const chordName = chords[0] || (voicing.length >= 2 ? 'No standard chord' : '—')

  return (
    <>
      <p className="chord-meta">
        Click a fret to place a note on that string. Click it again to mute the string.
      </p>

      <div className="prompt">
        Chord: <span className="target-note">{chordName}</span>
      </div>

      {chords.length > 1 && (
        <div className="chord-meta">also: {chords.slice(1).join('  ·  ')}</div>
      )}

      <Fretboard activeStrings={ALL_STRINGS} cellState={cellState} onCellClick={handleCellClick} />

      <div className="chord-strings">
        {STRING_INDICES_LOW_TO_HIGH.map((si) => {
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
