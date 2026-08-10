import { STRINGS } from '../lib/fretboard.js'

const GROUPS = [
  { label: 'Low strings (E A D)', indices: [3, 4, 5] },
  { label: 'High strings (G B e)', indices: [0, 1, 2] },
  { label: 'Bass pair (E A)', indices: [4, 5] },
  { label: 'Treble pair (B e)', indices: [0, 1] },
]

export default function Controls({ mode, setMode, singleString, setSingleString, group, setGroup }) {
  return (
    <div className="controls">
      <div className="mode-row">
        <label className={mode === 'single' ? 'mode-btn active' : 'mode-btn'}>
          <input type="radio" name="mode" value="single" checked={mode === 'single'} onChange={() => setMode('single')} />
          Single string
        </label>
        <label className={mode === 'group' ? 'mode-btn active' : 'mode-btn'}>
          <input type="radio" name="mode" value="group" checked={mode === 'group'} onChange={() => setMode('group')} />
          String group
        </label>
        <label className={mode === 'all' ? 'mode-btn active' : 'mode-btn'}>
          <input type="radio" name="mode" value="all" checked={mode === 'all'} onChange={() => setMode('all')} />
          Full neck
        </label>
      </div>

      {mode === 'single' && (
        <div className="sub-row">
          {STRINGS.map((s, i) => (
            <button
              key={s.label + i}
              className={singleString === i ? 'chip active' : 'chip'}
              onClick={() => setSingleString(i)}
            >
              {s.label} string
            </button>
          ))}
        </div>
      )}

      {mode === 'group' && (
        <div className="sub-row">
          {GROUPS.map((g) => (
            <button
              key={g.label}
              className={group === g.indices ? 'chip active' : 'chip'}
              onClick={() => setGroup(g.indices)}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { GROUPS }
