import { STRINGS, FRET_COUNT, MARKER_FRETS } from '../lib/fretboard.js'

const NUT_X = 60
const FRET_WIDTH = 50
const STRING_GAP = 36
const TOP_MARGIN = 30
const RIGHT_PAD = 30
const WIDTH = NUT_X + FRET_COUNT * FRET_WIDTH + RIGHT_PAD
const HEIGHT = TOP_MARGIN * 2 + STRING_GAP * (STRINGS.length - 1)

function cellX(fret) {
  if (fret === 0) return NUT_X / 2
  return NUT_X + (fret - 1) * FRET_WIDTH + FRET_WIDTH / 2
}

function stringY(stringIndex) {
  return TOP_MARGIN + stringIndex * STRING_GAP
}

export default function Fretboard({ activeStrings, cellState, onCellClick }) {
  const isActive = (stringIndex) => activeStrings.has(stringIndex)

  return (
    <svg
      className="fretboard"
      viewBox={`0 0 ${WIDTH} ${HEIGHT + 30}`}
      role="img"
      aria-label="Guitar fretboard"
    >
      {/* fret markers */}
      {MARKER_FRETS.map((fret) => {
        const x = cellX(fret)
        const midY = (stringY(1) + stringY(4)) / 2
        if (fret === 12) {
          return (
            <g key={fret}>
              <circle cx={x} cy={stringY(1) - 6} r="5" className="fret-marker" />
              <circle cx={x} cy={stringY(4) + 6} r="5" className="fret-marker" />
            </g>
          )
        }
        return <circle key={fret} cx={x} cy={midY} r="5" className="fret-marker" />
      })}

      {/* fret number labels */}
      {MARKER_FRETS.map((fret) => (
        <text key={fret} x={cellX(fret)} y={HEIGHT + 22} className="fret-label" textAnchor="middle">
          {fret}
        </text>
      ))}

      {/* nut */}
      <rect x={NUT_X - 4} y={TOP_MARGIN - 10} width="4" height={HEIGHT - 2 * TOP_MARGIN + 20} className="nut" />

      {/* fret lines */}
      {Array.from({ length: FRET_COUNT }, (_, i) => i + 1).map((fret) => (
        <line
          key={fret}
          x1={NUT_X + fret * FRET_WIDTH}
          y1={TOP_MARGIN - 10}
          x2={NUT_X + fret * FRET_WIDTH}
          y2={HEIGHT - TOP_MARGIN + 10}
          className="fret-line"
        />
      ))}

      {/* strings */}
      {STRINGS.map((s, i) => (
        <line
          key={s.label + i}
          x1={0}
          y1={stringY(i)}
          x2={WIDTH - RIGHT_PAD + 10}
          y2={stringY(i)}
          className="string-line"
          strokeWidth={1 + (STRINGS.length - i) * 0.35}
        />
      ))}

      {/* string labels */}
      {STRINGS.map((s, i) => (
        <text key={'label-' + s.label + i} x={-10} y={stringY(i) + 4} className="string-label" textAnchor="end">
          {s.label}
        </text>
      ))}

      {/* clickable cells */}
      {STRINGS.map((s, stringIndex) =>
        Array.from({ length: FRET_COUNT + 1 }, (_, fret) => fret).map((fret) => {
          const key = `${stringIndex}-${fret}`
          const state = cellState[key] // undefined | 'correct' | 'wrong'
          const active = isActive(stringIndex)
          return (
            <circle
              key={key}
              cx={cellX(fret)}
              cy={stringY(stringIndex)}
              r="13"
              className={[
                'cell',
                active ? 'cell-active' : 'cell-inactive',
                state ? `cell-${state}` : '',
              ].join(' ')}
              onClick={() => active && onCellClick(stringIndex, fret)}
            />
          )
        })
      )}
    </svg>
  )
}
