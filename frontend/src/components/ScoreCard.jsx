import './ScoreCard.css'

export default function ScoreCard({ label, score, icon, color = 'blue', subtitle, animate = true }) {
  const maxScore = 100
  const pct      = Math.min(Math.max(score || 0, 0), 100)

  const colorMap = {
    blue:   { bar: 'var(--accent-blue)',   glow: 'rgba(59,130,246,0.3)'  },
    cyan:   { bar: 'var(--accent-cyan)',   glow: 'rgba(6,182,212,0.3)'   },
    green:  { bar: 'var(--accent-green)',  glow: 'rgba(34,197,94,0.3)'   },
    amber:  { bar: 'var(--accent-amber)',  glow: 'rgba(245,158,11,0.3)'  },
    red:    { bar: 'var(--accent-red)',    glow: 'rgba(239,68,68,0.3)'   },
    purple: { bar: 'var(--accent-purple)', glow: 'rgba(139,92,246,0.3)'  },
  }

  const c = colorMap[color] || colorMap.blue

  function getColor(s) {
    if (s >= 75) return colorMap.green.bar
    if (s >= 55) return colorMap.amber.bar
    return colorMap.red.bar
  }

  const barColor = score !== undefined ? getColor(pct) : c.bar

  return (
    <div className={`score-card ${animate ? 'fade-in' : ''}`}>
      <div className="score-card-header">
        <span className="score-card-icon">{icon}</span>
        <div className="score-card-meta">
          <span className="score-card-label">{label}</span>
          {subtitle && <span className="score-card-subtitle">{subtitle}</span>}
        </div>
        <span className="score-card-value" style={{ color: barColor }}>
          {score !== null && score !== undefined ? `${pct}` : '—'}
          <span className="score-card-unit">{score !== null && score !== undefined ? '%' : ''}</span>
        </span>
      </div>
      <div className="score-bar">
        <div
          className="score-bar-fill"
          style={{
            width:      `${pct}%`,
            background: barColor,
            boxShadow:  `0 0 8px ${barColor}60`,
          }}
        />
      </div>
    </div>
  )
}