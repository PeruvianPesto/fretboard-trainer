// Movable chord shapes whose root sits on the low E (6th) string — the classic
// "E-shape" barre grips and their close relatives. Barre the whole shape at any
// fret to move it into any key; none of them use an open string.
//
// `offsets` is indexed the same way as STRINGS (0 = high e … 5 = low E) and
// holds the fret offset above the root fret for that string, or null when the
// string is muted. Offset 0 on string 5 is always the root itself.

import { STRINGS } from './fretboard.js'

// STRINGS is ordered high-to-low, so the low E that carries the root is index 5.
export const ROOT_STRING_INDEX = STRINGS.length - 1

export const CHORD_SHAPES = [
  { id: 'maj',   name: 'Major',           formula: '1 · 3 · 5',           offsets: [0, 0, 1, 2, 2, 0] },
  { id: 'min',   name: 'Minor',           formula: '1 · ♭3 · 5',          offsets: [0, 0, 0, 2, 2, 0] },
  { id: '7',     name: 'Dominant 7th',    formula: '1 · 3 · 5 · ♭7',      offsets: [0, 0, 1, 0, 2, 0] },
  { id: 'maj7',  name: 'Major 7th',       formula: '1 · 3 · 5 · 7',       offsets: [0, 0, 1, 1, 2, 0] },
  { id: 'm7',    name: 'Minor 7th',       formula: '1 · ♭3 · 5 · ♭7',     offsets: [0, 0, 0, 0, 2, 0] },
  { id: 'mMaj7', name: 'Minor/Major 7th', formula: '1 · ♭3 · 5 · 7',      offsets: [0, 0, 0, 1, 2, 0] },
  { id: 'm7b5',  name: 'Minor 7 ♭5',      formula: '1 · ♭3 · ♭5 · ♭7',    offsets: [null, null, 0, 0, 1, 0] },
  { id: 'dim7',  name: 'Diminished 7th',  formula: '1 · ♭3 · ♭5 · ♭♭7',   offsets: [null, 2, 0, null, 1, 0] },
  { id: '6',     name: '6th',             formula: '1 · 3 · 5 · 6',       offsets: [0, 2, 1, 2, 2, 0] },
  { id: 'm6',    name: 'Minor 6th',       formula: '1 · ♭3 · 5 · 6',      offsets: [0, 2, 0, 2, 2, 0] },
  { id: 'sus4',  name: 'Suspended 4th',   formula: '1 · 4 · 5',           offsets: [0, 0, 2, 2, 2, 0] },
  { id: 'add9',  name: 'add9',            formula: '1 · 3 · 5 · 9',       offsets: [2, 0, 1, 2, 2, 0] },
  { id: '9',     name: 'Dominant 9th',    formula: '1 · 3 · 5 · ♭7 · 9',  offsets: [2, 0, 1, 0, 2, 0] },
  { id: 'aug',   name: 'Augmented',       formula: '1 · 3 · ♯5',          offsets: [0, 1, 1, 2, 3, 0] },
]

// Semitones above the root → the scale-degree name guitarists read off a grip.
const INTERVAL_LABELS = ['R', '♭9', '9', '♭3', '3', '11', '♭5', '5', '♯5', '6', '♭7', '7']

// `dim` spells 9 semitones as ♭♭7 (the diminished 7th) rather than its
// enharmonic 6, so a dim7 grip reads with the right chord tones.
export function intervalLabel(semitones, { dim = false } = {}) {
  const i = (((semitones % 12) + 12) % 12)
  if (dim && i === 9) return '♭♭7'
  return INTERVAL_LABELS[i]
}
