import { NOTE_NAMES } from './fretboard.js'

// Interval sets (semitones above the root) mapped to a chord suffix.
// A set is recognised only when the played pitch classes match a formula
// exactly, so a triad never collides with the 7th chord that contains it.
// `dropFifth` also registers the same shape with the 5th (7) removed, covering
// the common guitar habit of leaving the fifth out of a 7th-chord voicing.
const BASE_QUALITIES = [
  { suffix: 'maj7', intervals: [0, 4, 7, 11], dropFifth: true },
  { suffix: '7', intervals: [0, 4, 7, 10], dropFifth: true },
  { suffix: 'm7', intervals: [0, 3, 7, 10], dropFifth: true },
  { suffix: 'mMaj7', intervals: [0, 3, 7, 11] },
  { suffix: 'm7b5', intervals: [0, 3, 6, 10] },
  { suffix: 'dim7', intervals: [0, 3, 6, 9] },
  { suffix: '6', intervals: [0, 4, 7, 9] },
  { suffix: 'm6', intervals: [0, 3, 7, 9] },
  { suffix: 'add9', intervals: [0, 2, 4, 7] },
  { suffix: '9', intervals: [0, 2, 4, 7, 10], dropFifth: true },
  { suffix: 'maj9', intervals: [0, 2, 4, 7, 11] },
  { suffix: 'm9', intervals: [0, 2, 3, 7, 10] },
  { suffix: '', intervals: [0, 4, 7] }, // major triad
  { suffix: 'm', intervals: [0, 3, 7] }, // minor triad
  { suffix: 'dim', intervals: [0, 3, 6] },
  { suffix: 'aug', intervals: [0, 4, 8] },
  { suffix: 'sus2', intervals: [0, 2, 7] },
  { suffix: 'sus4', intervals: [0, 5, 7] },
  { suffix: '5', intervals: [0, 7] }, // power chord
]

const CHORD_QUALITIES = BASE_QUALITIES.flatMap((q) =>
  q.dropFifth
    ? [q, { suffix: q.suffix, intervals: q.intervals.filter((i) => i !== 7) }]
    : [q]
)

const sameSet = (a, b) => a.length === b.length && a.every((v, i) => v === b[i])

// pitchClasses: array of 0-11 values (duplicates allowed).
// bassPc: pitch class of the lowest-sounding note, or null.
// Returns candidate chord names, best guess first. A reading whose root is
// the bass note wins; when the root sits above the bass the chord is spelled
// as a slash chord, e.g. "C/E".
export function detectChords(pitchClasses, bassPc = null) {
  const set = [...new Set(pitchClasses)].sort((a, b) => a - b)
  if (set.length === 0) return []
  if (set.length === 1) return [`${NOTE_NAMES[set[0]]} (single note)`]

  const matches = []
  for (let root = 0; root < 12; root++) {
    if (!set.includes(root)) continue
    const intervals = set.map((pc) => (((pc - root) % 12) + 12) % 12).sort((a, b) => a - b)
    for (const quality of CHORD_QUALITIES) {
      if (sameSet(intervals, quality.intervals)) {
        const isSlash = bassPc != null && bassPc !== root
        matches.push({
          name: NOTE_NAMES[root] + quality.suffix + (isSlash ? `/${NOTE_NAMES[bassPc]}` : ''),
          bassMatch: bassPc == null || bassPc === root,
        })
        break
      }
    }
  }

  matches.sort((a, b) => Number(b.bassMatch) - Number(a.bassMatch))
  return matches.map((m) => m.name)
}
