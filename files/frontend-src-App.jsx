import { useState, useEffect } from 'react'
import './App.css'
import SetSelector from './components/SetSelector'
import Results from './components/Results'

function App() {
  const [selectedSets, setSelectedSets] = useState([])
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  // Check if backend is ready
  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then(res => res.json())
      .then(data => console.log('Backend status:', data))
      .catch(err => {
        console.error('Backend not ready:', err)
        setError('Cannot connect to backend. Is Docker running?')
      })
  }, [])

  const handleSelectSets = (sets) => {
    setSelectedSets(sets)
  }

  const handleFindBuildable = async () => {
    if (selectedSets.length === 0) {
      setError('Please select at least one set')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/api/builder/findBuildable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setIds: selectedSets })
      })

      if (!response.ok) throw new Error('API error')
      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError('Error finding buildable sets: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🟧 LEGO Set Builder</h1>
        <p>Find what other sets you can build with your collection</p>
      </header>

      <main className="container">
        {error && <div className="error">{error}</div>}

        <section className="selector-section">
          <h2>Step 1: Select Your Sets</h2>
          <SetSelector onSelectSets={handleSelectSets} apiUrl={API_URL} />
          <button 
            onClick={handleFindBuildable}
            disabled={loading || selectedSets.length === 0}
            className="find-button"
          >
            {loading ? 'Finding...' : 'Find Buildable Sets →'}
          </button>
        </section>

        {results && (
          <section className="results-section">
            <h2>Results</h2>
            <Results data={results} ownedSets={selectedSets} />
          </section>
        )}
      </main>
    </div>
  )
}

export default App
