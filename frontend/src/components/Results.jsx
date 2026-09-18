import './Results.css'

export default function Results({ data, ownedSets }) {
  if (!data) return null

  const { buildable, almostBuildable, ownedCount, buildableCount } = data

  return (
    <div className="results">
      <div className="results-summary">
        <div className="summary-item">
          <span className="label">Sets Owned</span>
          <span className="value">{ownedCount}</span>
        </div>
        <div className="summary-item">
          <span className="label">Can Build</span>
          <span className="value" style={{ color: '#4CAF50' }}>
            {buildableCount}
          </span>
        </div>
        <div className="summary-item">
          <span className="label">Almost Can Build</span>
          <span className="value">{almostBuildable.length}</span>
        </div>
      </div>

      {buildable.length > 0 && (
        <div className="results-section">
          <h3>✅ Can Fully Build ({buildable.length})</h3>
          <div className="results-grid">
            {buildable.map(set => (
              <div key={set.setId} className="result-card">
                {set.imageUrl && (
                  <img src={set.imageUrl} alt={set.name} />
                )}
                <div className="card-info">
                  <h4>{set.name}</h4>
                  <p>{set.year} • {set.piecesCount} pieces</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {almostBuildable.length > 0 && (
        <div className="results-section">
          <h3>🔶 Almost Can Build ({almostBuildable.length})</h3>
          <div className="almost-grid">
            {almostBuildable.map(set => (
              <div key={set.setId} className="almost-card">
                <h4>{set.name}</h4>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${set.progress}%` }}
                  ></div>
                </div>
                <p>{set.progress}% complete</p>
                <details>
                  <summary>Missing parts ({set.missingParts.length})</summary>
                  <ul>
                    {set.missingParts.map((part, idx) => (
                      <li key={idx}>
                        {part.brickName}: need {part.needed}, have {part.have}
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}

      {buildable.length === 0 && almostBuildable.length === 0 && (
        <div className="no-results">
          <p>😅 Can't build any other sets with these pieces.</p>
          <p>Try selecting more sets!</p>
        </div>
      )}
    </div>
  )
}
