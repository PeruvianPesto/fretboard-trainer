import { useState } from 'react'
import PracticeMode from './components/PracticeMode.jsx'
import ChallengeMode from './components/ChallengeMode.jsx'
import ChordCreator from './components/ChordCreator.jsx'
import ChordGlossary from './components/ChordGlossary.jsx'

const TABS = [
  { id: 'practice', label: 'Practice', Component: PracticeMode },
  { id: 'challenge', label: 'Challenge', Component: ChallengeMode },
  { id: 'chord', label: 'Chord Creator', Component: ChordCreator },
  { id: 'glossary', label: 'Chord Glossary', Component: ChordGlossary },
]

export default function App() {
  const [tab, setTab] = useState('practice')
  const ActiveMode = TABS.find((t) => t.id === tab).Component

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <h1>Bonk's Fretboard Trainer</h1>
        </div>
        <p className="brand-sub">Note &amp; chord drills across the EADGBE neck</p>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="mode-panel">
        <ActiveMode />
      </main>
    </div>
  )
}
