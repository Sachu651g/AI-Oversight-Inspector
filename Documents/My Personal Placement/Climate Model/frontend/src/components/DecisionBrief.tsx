import { useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:5000'

interface DecisionBriefProps {
  riskData?: any
}

export default function DecisionBrief({ riskData }: DecisionBriefProps) {
  const [brief, setBrief] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (riskData && riskData.percentage >= 50) {
      generateBrief()
    }
  }, [riskData])

  const generateBrief = async () => {
    setLoading(true)
    try {
      const response = await axios.post(`${API_BASE}/api/alert/generate`, {
        zoneId: 'Zone-4',
        riskLevel: riskData?.level || 'HIGH',
        parameters: {
          rainfall: 45,
          windSpeed: 65
        }
      })
      setBrief(response.data)
    } catch (error) {
      console.error('Failed to generate brief:', error)
      // Use fallback brief
      setBrief({
        situation: `${riskData?.level || 'HIGH'} risk detected. Rainfall exceeding 40mm/hr. Saturation levels elevated.`,
        action: 'Initiate evacuation for riverside residents. Secure critical infrastructure.',
        resources: { responders: 12, medical: 4 }
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#2a2a2a',
      borderRadius: '6px',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9e9e9e' }}>
          DECISION BRIEF
        </div>
        <span style={{
          background: 'rgba(156, 39, 176, 0.3)',
          color: '#ce93d8',
          padding: '4px 12px',
          borderRadius: '2px',
          fontSize: '0.75rem'
        }}>
          AI GENERATED
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#757575' }}>
          <span className="material-icons" style={{ fontSize: '48px', animation: 'spin 1s linear infinite' }}>refresh</span>
          <div>Generating AI brief...</div>
        </div>
      ) : brief ? (
        <>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#9e9e9e', marginBottom: '8px', textTransform: 'uppercase' }}>
              SITUATION
            </div>
            <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
              {brief.situation || 'Incoming storm surge predicted. Precipitation exceeding 40mm/hr in Zone 4. Saturation levels at 92%.'}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#F44336', marginBottom: '8px', textTransform: 'uppercase' }}>
              RECOMMENDED ACTION (URGENT)
            </div>
            <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
              {brief.action || 'Initiate Category 2 evacuation for riverside residents. Secure floodgates at the North Terminal.'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#9e9e9e', marginBottom: '8px', textTransform: 'uppercase' }}>
              RESOURCES
            </div>
            <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-icons" style={{ color: '#9ecaff' }}>medical_services</span>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 300 }}>{brief.resources?.responders || 12}</div>
                  <div style={{ fontSize: '0.75rem', color: '#757575' }}>Responders</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-icons" style={{ color: '#9ecaff' }}>home_work</span>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 300 }}>{brief.resources?.medical || 4}</div>
                  <div style={{ fontSize: '0.75rem', color: '#757575' }}>Medical</div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', color: '#757575' }}>
          Run simulation to generate AI decision brief
        </div>
      )}
    </div>
  )
}
