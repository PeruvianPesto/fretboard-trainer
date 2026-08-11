import { NOTE_NAMES } from './fretboard.js'

const A4_FREQUENCY = 440
const A4_MIDI = 69

// Convert a frequency in Hz to the nearest note name, octave (SPN, same
// convention as fretboard.js — E2 is the open low E string), and how far
// off in cents the played pitch was from that note's center.
export function frequencyToNote(frequency) {
  const midiFloat = A4_MIDI + 12 * Math.log2(frequency / A4_FREQUENCY)
  const midi = Math.round(midiFloat)
  const cents = Math.round((midiFloat - midi) * 100)
  const note = NOTE_NAMES[((midi % 12) + 12) % 12]
  const octave = Math.floor(midi / 12) - 1
  return { note, octave, cents }
}
