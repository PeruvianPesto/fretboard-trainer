// Standard tuning EADGBE, 22-fret neck.
// STRINGS is ordered high-to-low (row 0 = high e, row 5 = low E),
// matching how a fretboard diagram / standard tab is usually read top-to-bottom.

export const NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
]

// openOctave uses scientific pitch notation (SPN) — the standard theory
// convention where middle C is C4. Standard tuning open strings are
// E2 A2 D3 G3 B3 E4, low to high.
export const STRINGS = [
  { label: 'e', openIndex: NOTE_NAMES.indexOf('E'), openOctave: 4 }, // 1st string, high E
  { label: 'B', openIndex: NOTE_NAMES.indexOf('B'), openOctave: 3 }, // 2nd string
  { label: 'G', openIndex: NOTE_NAMES.indexOf('G'), openOctave: 3 }, // 3rd string
  { label: 'D', openIndex: NOTE_NAMES.indexOf('D'), openOctave: 3 }, // 4th string
  { label: 'A', openIndex: NOTE_NAMES.indexOf('A'), openOctave: 2 }, // 5th string
  { label: 'E', openIndex: NOTE_NAMES.indexOf('E'), openOctave: 2 }, // 6th string, low E
]

export const FRET_COUNT = 22

// String indices as they sit in STRINGS (row 0 = high e … row 5 = low E).
export const ALL_STRING_INDICES = STRINGS.map((_, i) => i)
// The same indices low-to-high (low E first) — chord-chart / tab reading order.
export const STRING_INDICES_LOW_TO_HIGH = [...ALL_STRING_INDICES].reverse()

// Frets that traditionally get inlay markers (12 gets a double dot).
export const MARKER_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21]

// Semitones from C0 — the absolute pitch, octave and pitch class folded into
// one number so notes can be ordered and compared by how they actually sound.
export function absoluteSemitoneAt(stringIndex, fret) {
  const { openIndex, openOctave } = STRINGS[stringIndex]
  return openOctave * 12 + openIndex + fret
}

// Pitch class (0 = C … 11 = B), i.e. the note name with the octave stripped off.
export function pitchClassAt(stringIndex, fret) {
  return absoluteSemitoneAt(stringIndex, fret) % 12
}

export function noteAt(stringIndex, fret) {
  return NOTE_NAMES[pitchClassAt(stringIndex, fret)]
}

// Octave number in scientific pitch notation (e.g. the "4" in E4).
// Notes an octave apart share a name/pitch class but differ here.
export function octaveAt(stringIndex, fret) {
  return Math.floor(absoluteSemitoneAt(stringIndex, fret) / 12)
}

// Full scientific pitch notation, e.g. "E2" (open low E) vs "E3" (12th fret).
export function noteWithOctaveAt(stringIndex, fret) {
  return `${noteAt(stringIndex, fret)}${octaveAt(stringIndex, fret)}`
}

// Build the flat list of {stringIndex, fret} cells for a set of allowed strings.
export function cellsForStrings(stringIndices) {
  const cells = []
  for (const stringIndex of stringIndices) {
    for (let fret = 0; fret <= FRET_COUNT; fret++) {
      cells.push({ stringIndex, fret })
    }
  }
  return cells
}

export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// All {stringIndex, fret} cells (within the given strings) that produce
// the same note+octave — a played pitch can't tell us which string/fret
// was used, only which pitch was heard, so several cells may all match.
export function cellsMatchingNote(note, octave, stringIndices) {
  const cells = []
  for (const stringIndex of stringIndices) {
    for (let fret = 0; fret <= FRET_COUNT; fret++) {
      if (noteAt(stringIndex, fret) === note && octaveAt(stringIndex, fret) === octave) {
        cells.push({ stringIndex, fret })
      }
    }
  }
  return cells
}
