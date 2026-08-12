import { useState } from 'react'
import PracticeMode from './components/PracticeMode.jsx'
import ChallengeMode from './components/ChallengeMode.jsx'

export default function App() {
  const [tab, setTab] = useState('practice') // 'practice' | 'challenge'

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
      </div>

      {tab === 'practice' ? <PracticeMode /> : <ChallengeMode />}
    </div>
  )
}
