import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:5000'

interface SidebarProps {
  onSimulationComplete?: (data: any) => void
  onRiskUpdate?: (data: any) => void
}

export default function Sidebar({ onSimulationComplete, onRiskUpdate }: SidebarProps) {
  const [rainfall, setRainfall] = useState(45)
  const [windSpeed, setWindSpeed] = useState(65)
  const [humidity, setHumidity] = useState(78)
  const [soilMoisture, setSoilMoisture] = useState(62)
  const [temperature, setTemperature] = useState(32)
  
  const [riskPercentage, setRiskPercentage] = useState(72)
  const [riskLevel, setRiskLevel] = useState('HIGH RISK')
  const [riskCounts, setRiskCounts] = useState({ low: 5, med: 3, high: 2, crit: 0 })
  const [isSimulating, setIsSimulating] = useState(false)

  // Calculate risk based on parameters (for rainfall/flood focus)
  useEffect(() => {
    // Focus on rainfall and soil moisture for flood risk
    const rainfallRisk = (rainfall / 300) * 100
    const soilRisk = (soilMoisture / 100) * 100
    const humidityRisk = (humidity / 100) * 100
    const windRisk = (windSpeed / 200) * 100
    const tempRisk = ((temperature - 15) / 30) * 100
    
    // Weight rainfall and soil moisture more heavily for flood prediction
    const overallRisk = (rainfallRisk * 0.4 + soilRisk * 0.3 + humidityRisk * 0.15 + windRisk * 0.1 + tempRisk * 0.05)
    
    setRiskPercentage(Math.round(overallRisk))
    
    if (overallRisk >= 75) {
      setRiskLevel('CRITICAL')
      setRiskCounts({ low: 2, med: 3, high: 3, crit: 2 })
    } else if (overallRisk >= 50) {
      setRiskLevel('HIGH RISK')
      setRiskCounts({ low: 5, med: 3, high: 2, crit: 0 })
    } else if (overallRisk >= 25) {
      setRiskLevel('MEDIUM')
      setRiskCounts({ low: 6, med: 4, high: 0, crit: 0 })
    } else {
      setRiskLevel('LOW')
      setRiskCounts({ low: 10, med: 0, high: 0, crit: 0 })
    }

    // Update parent with risk data
    if (onRiskUpdate) {
      onRiskUpdate({
        percentage: Math.round(overallRisk),
        level: overallRisk >= 75 ? 'CRITICAL' : overallRisk >= 50 ? 'HIGH' : overallRisk >= 25 ? 'MEDIUM' : 'LOW',
        counts: riskCounts,
        criticalZones: overallRisk >= 75 ? ['Zone 4', 'Zone 7'] : overallRisk >= 50 ? ['Zone 4'] : []
      })
    }
  }, [rainfall, windSpeed, humidity, soilMoisture, temperature])

  const handleSimulation = async () => {
    setIsSimulating(true)
    try {
      console.log('Starting simulation with parameters:', {
        rainfall,
        windSpeed,
        humidity,
        soilSaturation: soilMoisture,
        temperature
      })

      // Call risk classification API
      const riskResponse = await axios.post(`${API_BASE}/api/risk/classify`, {
        rainfall,
        windSpeed,
        humidity,
        soilSaturation: soilMoisture,
        temperature
      })
      
      console.log('Risk classification response:', riskResponse.data)

      // Call simulation generation API
      const simResponse = await axios.post(`${API_BASE}/api/simulate/generate`, {
        rainfall,
        windSpeed,
        humidity,
        soilSaturation: soilMoisture,
        temperature
      })

      console.log('Simulation response:', simResponse.data)

      // Update parent with simulation data
      if (onSimulationComplete) {
        onSimulationComplete(simResponse.data)
      }

      alert('✅ Simulation complete! Check the map and panels for results.')
    } catch (error: any) {
      console.error('Simulation error:', error)
      alert(`❌ Simulation failed: ${error.response?.data?.message || error.message}`)
    } finally {
      setIsSimulating(false)
    }
  }

  const getRiskColor = () => {
    if (riskPercentage >= 75) return '#F44336'
    if (riskPercentage >= 50) return '#FF9800'
    if (riskPercentage >= 25) return '#FFC107'
    return '#4CAF50'
  }

  const getRiskBgColor = () => {
    if (riskPercentage >= 75) return 'rgba(244, 67, 54, 0.3)'
    if (riskPercentage >= 50) return 'rgba(255, 152, 0, 0.3)'
    if (riskPercentage >= 25) return 'rgba(255, 193, 7, 0.3)'
    return 'rgba(76, 175, 80, 0.3)'
  }

  const getRiskTextColor = () => {
    if (riskPercentage >= 75) return '#ffb4ab'
    if (riskPercentage >= 50) return '#ffb74d'
    if (riskPercentage >= 25) return '#ffd54f'
    return '#81c784'
  }

  return (
    <div style={{
      width: '280px',
      background: '#1c1b1b',
      padding: '24px',
      overflowY: 'auto'
    }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9e9e9e', marginBottom: '16px' }}>
        LIVE PARAMETERS
      </div>
      <div style={{ fontSize: '0.75rem', color: '#757575', marginBottom: '32px' }}>
        DISTRICT ALPHA-7
      </div>

      {/* RAINFALL - Most important for flood prediction */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#9e9e9e' }}>
            <span className="material-icons" style={{ fontSize: '16px', color: '#9ecaff' }}>water_drop</span>
            <span>RAINFALL</span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{rainfall}mm/hr</div>
        </div>
        <input type="range" min="0" max="300" value={rainfall} onChange={(e) => setRainfall(Number(e.target.value))} />
      </div>

      {/* WIND SPEED */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#9e9e9e' }}>
            <span className="material-icons" style={{ fontSize: '16px', color: '#9ecaff' }}>air</span>
            <span>WIND SPEED</span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{windSpeed}km/h</div>
        </div>
        <input type="range" min="0" max="200" value={windSpeed} onChange={(e) => setWindSpeed(Number(e.target.value))} />
      </div>

      {/* HUMIDITY */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#9e9e9e' }}>
            <span className="material-icons" style={{ fontSize: '16px', color: '#9ecaff' }}>opacity</span>
            <span>HUMIDITY</span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{humidity}%</div>
        </div>
        <input type="range" min="0" max="100" value={humidity} onChange={(e) => setHumidity(Number(e.target.value))} />
      </div>

      {/* SOIL MOISTURE - Important for flood prediction */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#9e9e9e' }}>
            <span className="material-icons" style={{ fontSize: '16px', color: '#9ecaff' }}>grass</span>
            <span>SOIL MOISTURE</span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{soilMoisture}%</div>
        </div>
        <input type="range" min="0" max="100" value={soilMoisture} onChange={(e) => setSoilMoisture(Number(e.target.value))} />
      </div>

      {/* TEMPERATURE */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#9e9e9e' }}>
            <span className="material-icons" style={{ fontSize: '16px', color: '#9ecaff' }}>thermostat</span>
            <span>TEMPERATURE</span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{temperature}°C</div>
        </div>
        <input type="range" min="0" max="50" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} />
      </div>

      {/* RISK AGGREGATOR */}
      <div style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9e9e9e', marginBottom: '16px', marginTop: '48px' }}>
        RISK AGGREGATOR
      </div>
      
      <div style={{ width: '140px', height: '140px', margin: '32px auto', position: 'relative' }}>
        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="70" cy="70" r="60" stroke="#353534" strokeWidth="8" fill="none"/>
          <circle 
            cx="70" 
            cy="70" 
            r="60" 
            stroke={getRiskColor()} 
            strokeWidth="8" 
            fill="none" 
            strokeDasharray={`${(riskPercentage / 100) * 377} 377`} 
            strokeLinecap="round"
          />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 300 }}>{riskPercentage}%</div>
          <div style={{ 
            fontSize: '0.75rem', 
            background: getRiskBgColor(), 
            color: getRiskTextColor(), 
            padding: '4px 12px', 
            borderRadius: '2px', 
            marginTop: '8px', 
            display: 'inline-block' 
          }}>
            {riskLevel}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'center', marginTop: '24px' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#757575' }}>Low</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 300 }}>{riskCounts.low}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#757575' }}>Med</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 300 }}>{riskCounts.med}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#757575' }}>High</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 300 }}>{riskCounts.high}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#757575' }}>Crit</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 300 }}>{riskCounts.crit}</div>
        </div>
      </div>

      <button 
        onClick={handleSimulation}
        disabled={isSimulating}
        style={{
          width: '100%',
          padding: '14px',
          background: isSimulating ? '#757575' : 'linear-gradient(135deg, #9ecaff 0%, #2196f3 100%)',
          color: '#131313',
          border: 'none',
          borderRadius: '6px',
          fontWeight: 500,
          fontSize: '0.875rem',
          cursor: isSimulating ? 'not-allowed' : 'pointer',
          margin: '24px 0',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => !isSimulating && (e.currentTarget.style.transform = 'translateY(-2px)')}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        {isSimulating ? '⏳ SIMULATING...' : '▶ INITIATE SIMULATION'}
      </button>

      <div style={{ marginTop: 'auto', paddingTop: '48px' }}>
        <div 
          onClick={() => alert('Audit Log: View complete system audit trail')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#757575', fontSize: '0.875rem', cursor: 'pointer' }}
        >
          <span className="material-icons" style={{ fontSize: '18px' }}>history_edu</span>
          <span>Audit Log</span>
        </div>
        <div 
          onClick={() => alert('System Health: All systems operational')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#757575', fontSize: '0.875rem', cursor: 'pointer' }}
        >
          <span className="material-icons" style={{ fontSize: '18px' }}>terminal</span>
          <span>System Health</span>
        </div>
      </div>
    </div>
  )
}
