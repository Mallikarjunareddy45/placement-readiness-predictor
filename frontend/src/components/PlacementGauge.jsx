import { useEffect, useState } from 'react'
import './PlacementGauge.css'

export default function PlacementGauge({ probability, label, confidence }) {
  const [displayed, setDisplayed] = useState(0)
  const size    = 220
  const stroke  = 14
  const radius  = (size - stroke) / 2
  const circ    = 2 * Math.PI * radius
  const target  = Math.min(Math.max(probability || 0, 0), 100)
  const offset  = circ - (displayed / 100) * circ

  // Animate count-up
  useEffect(() => {
    if (!target) return
    let start = null
    const duration = 1400
    function step(ts) {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setDisplayed(Math.round(ease * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target])

  function getLabelStyle(l) {
    const map = {
      'Ready':             { color: 'var(--accent-green)',  bg: 'rgba(34,197,94,0.15)'  },
      'Almost Ready':      { color: 'var(--accent-blue)',   bg: 'rgba(59,130,246,0.15)' },
      'Needs Improvement': { color: 'var(--accent-amber)',  bg: 'rgba(245,158,11,0.15)' },
      'Not Ready':         { color: 'var(--accent-red)',    bg: 'rgba(239,68,68,0.15)'  },
    }
    return map[l] || { color: 'var(--text-muted)', bg: 'var(--bg-elevated)' }
  }

  function getTrackColor(p) {
    if (p >= 80) return 'var(--accent-green)'
    if (p >= 65) return 'var(--accent-blue)'
    if (p >= 50) return 'var(--accent-amber)'
    return 'var(--accent-red)'
  }

  const trackColor  = getTrackColor(target)
  const labelStyle  = getLabelStyle(label)

  return (
    <div className="gauge-wrapper">
      <div className="gauge-glow" style={{ background: `radial-gradient(circle, ${trackColor}22 0%, transparent 70%)` }} />
      <svg width={size} height={size} className="gauge-svg">
        {/* Track */}
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke="var(--bg-elevated)"
          strokeWidth={stroke}
        />
        {/* Progress arc */}
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 0.05s linear', filter: `drop-shadow(0 0 8px ${trackColor})` }}
        />
      </svg>

      {/* Center content */}
      <div className="gauge-center">
        <span className="gauge-value" style={{ color: trackColor }}>
          {displayed}
          <span className="gauge-pct">%</span>
        </span>
        <span className="gauge-sub">Placement Probability</span>
        {label && (
          <span
            className="gauge-label"
            style={{ color: labelStyle.color, background: labelStyle.bg }}
          >
            {label}
          </span>
        )}
        {confidence && (
          <span className="gauge-confidence">
            {confidence} Confidence
          </span>
        )}
      </div>
    </div>
  )
}