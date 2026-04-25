import { useState, useEffect } from 'react'

interface SimulationPlayerProps {
  simulationData?: any
}

export default function SimulationPlayer({ simulationData }: SimulationPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    let interval: any
    if (isPlaying && simulationData) {
      interval = setInterval(() => {
        setCurrentFrame(prev => {
          if (prev >= 11) {
            setIsPlaying(false)
            return 11
          }
          return prev + 1
        })
      }, 1000) // 1 frame per second
    }
    return () => clearInterval(interval)
  }, [isPlaying, simulationData])

  const handlePlayPause = () => {
    if (!simulationData) {
      alert('⚠️ Run simulation first!')
      return
    }
    setIsPlaying(!isPlaying)
  }

  const handleFrameChange = (frame: number) => {
    setCurrentFrame(frame)
    setIsPlaying(false)
  }

  const getTimeLabel = (frame: number) => {
    if (frame === 0) return 'LIVE VIEW'
    if (frame < 0) return `T-${Math.abs(frame)}:00:00`
    return `T+${frame}:00:00`
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: '16px',
      left: '16px',
      right: '16px',
      background: 'rgba(42, 42, 42, 0.95)',
      backdropFilter: 'blur(20px)',
      padding: '16px',
      borderRadius: '6px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={handlePlayPause}
          style={{
            width: '40px',
            height: '40px',
            background: simulationData ? '#9ecaff' : '#757575',
            border: 'none',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: simulationData ? 'pointer' : 'not-allowed',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => simulationData && (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span className="material-icons" style={{ color: '#131313' }}>
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '8px', color: '#9e9e9e' }}>
            <span>T-12:00:00</span>
            <span style={{ color: currentFrame === 0 ? '#9ecaff' : '#9e9e9e', fontWeight: currentFrame === 0 ? 500 : 400 }}>
              {getTimeLabel(currentFrame)}
            </span>
            <span>T+12:00:00</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="11" 
            value={currentFrame} 
            onChange={(e) => handleFrameChange(Number(e.target.value))}
            disabled={!simulationData}
            style={{ 
              width: '100%',
              cursor: simulationData ? 'pointer' : 'not-allowed',
              opacity: simulationData ? 1 : 0.5
            }} 
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginTop: '4px', color: '#757575' }}>
            {[0, 3, 6, 9, 12].map(hour => (
              <span key={hour}>+{hour}h</span>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.75rem', minWidth: '80px' }}>
          <div style={{ color: '#9ecaff', fontWeight: 500 }}>
            {currentDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
          </div>
          <div style={{ color: '#757575' }}>
            {currentDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
      {simulationData && (
        <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#9e9e9e', textAlign: 'center' }}>
          Frame {currentFrame + 1}/12 • {isPlaying ? 'Playing...' : 'Paused'}
        </div>
      )}
    </div>
  )
}
