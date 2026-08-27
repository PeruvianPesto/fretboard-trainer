import { useState } from 'react'
import PracticeMode from './components/PracticeMode.jsx'
import ChallengeMode from './components/ChallengeMode.jsx'
import ChordCreator from './components/ChordCreator.jsx'

export default function App() {
  const [tab, setTab] = useState('practice') // 'practice' | 'challenge' | 'chord'

  return (
    <div className="app">
      <h1>Fretboard Trainer</h1>

      <div className="tabs">
        <button className={tab === 'practice' ? 'tab-btn active' : 'tab-btn'} onClick={() => setTab('practice')}>
          Practice
        </button>
        <button className={tab === 'challenge' ? 'tab-btn active' : 'tab-btn'} onClick={() => setTab('challenge')}>
          Challenge
        </button>
        <button className={tab === 'chord' ? 'tab-btn active' : 'tab-btn'} onClick={() => setTab('chord')}>
          Chord Creator
        </button>
      </div>

      {tab === 'practice' && <PracticeMode />}
      {tab === 'challenge' && <ChallengeMode />}
      {tab === 'chord' && <ChordCreator />}
    </div>
  )
}
