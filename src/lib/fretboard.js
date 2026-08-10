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

// Frets that traditionally get inlay markers (12 gets a double dot).
export const MARKER_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21]

export function noteAt(stringIndex, fret) {
  const { openIndex } = STRINGS[stringIndex]
  return NOTE_NAMES[(openIndex + fret) % 12]
}

// Octave number in scientific pitch notation (e.g. the "4" in E4).
// Notes an octave apart share a name/pitch class but differ here.
export function octaveAt(stringIndex, fret) {
  const { openIndex, openOctave } = STRINGS[stringIndex]
  const absoluteSemitone = openOctave * 12 + openIndex + fret
  return Math.floor(absoluteSemitone / 12)
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
