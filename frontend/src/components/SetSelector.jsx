import { useState, useEffect } from 'react'
import './SetSelector.css'

export default function SetSelector({ onSelectSets, apiUrl }) {
  const [sets, setSets] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Fetch all sets on mount
  useEffect(() => {
    const fetchSets = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/sets`)
        const data = await response.json()
        // Filter to only show sets with actual pieces (cleaner UI)
        const validSets = (data.sets || []).filter(set => set.piecesCount > 0)
        console.log(`Showing ${validSets.length} sets with pieces (out of ${data.sets.length} total)`)
        setSets(validSets)
      } catch (err) {
        console.error('Error fetching sets:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSets()
  }, [apiUrl])

  // Handle checkbox toggle
  const handleToggle = (setId) => {
    const newSelected = new Set(selected)
    if (newSelected.has(setId)) {
      newSelected.delete(setId)
    } else {
      newSelected.add(setId)
    }
    setSelected(newSelected)
    onSelectSets(Array.from(newSelected))
  }

  // Filter sets by search
  const filteredSets = sets.filter(set =>
    set.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="loading">Loading sets...</div>

  return (
    <div className="set-selector">
      <div className="selector-header">
        <p>{selected.size} sets selected out of {sets.length}</p>
        <input
          type="text"
          placeholder="Search sets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="sets-grid">
        {filteredSets.map(set => (
          <div key={set.setId} className="set-item">
            <input
              type="checkbox"
              id={set.setId}
              checked={selected.has(set.setId)}
              onChange={() => handleToggle(set.setId)}
            />
            <label htmlFor={set.setId}>
              {set.imageUrl && (
                <img src={set.imageUrl} alt={set.name} />
              )}
              <div className="set-info">
                <div className="set-name">{set.name}</div>
                <div className="set-meta">{set.year} • {set.piecesCount} pieces</div>
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}
