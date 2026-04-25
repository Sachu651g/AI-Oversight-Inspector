import { useEffect, useState } from 'react'

interface AlertPanelProps {
  riskData?: any
}

export default function AlertPanel({ riskData }: AlertPanelProps) {
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    if (riskData) {
      generateAlerts()
    }
  }, [riskData])

  const generateAlerts = () => {
    const newAlerts = []
    
    if (riskData.percentage >= 75) {
      newAlerts.push({
        zone: 'Zone 4',
        severity: 'Critical',
        desc: 'Severe flooding risk detected - immediate evacuation required',
        time: '2m ago',
        bg: 'rgba(244, 67, 54, 0.2)',
        border: '#F44336'
      })
      newAlerts.push({
        zone: 'Zone 7',
        severity: 'Critical',
        desc: 'High water levels approaching critical threshold',
        time: '5m ago',
        bg: 'rgba(244, 67, 54, 0.2)',
        border: '#F44336'
      })
    } else if (riskData.percentage >= 50) {
      newAlerts.push({
        zone: 'Zone 4',
        severity: 'Warning',
        desc: 'Elevated flood risk - prepare for possible evacuation',
        time: '2m ago',
        bg: 'rgba(255, 193, 7, 0.2)',
        border: '#FFC107'
      })
    }

    if (riskData.percentage >= 25) {
      newAlerts.push({
        zone: 'Zone 2',
        severity: 'Advisory',
        desc: 'Rainfall intensity increasing - monitor conditions',
        time: '14m ago',
        bg: 'rgba(76, 175, 80, 0.2)',
        border: '#4CAF50'
      })
    }

    setAlerts(newAlerts)
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
          ACTIVE ALERTS
        </div>
        <span style={{ fontSize: '0.75rem', color: '#757575' }}>
          {alerts.length.toString().padStart(2, '0')} ACTIVE
        </span>
      </div>

      {alerts.length > 0 ? (
        alerts.map((alert, idx) => (
          <div 
            key={idx} 
            onClick={() => alert(`Alert Details:\n\nZone: ${alert.zone}\nSeverity: ${alert.severity}\nDescription: ${alert.desc}\nTime: ${alert.time}`)}
            style={{
              padding: '16px',
              borderRadius: '6px',
              marginBottom: '12px',
              background: alert.bg,
              borderLeft: `4px solid ${alert.border}`,
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 500, fontSize: '0.875rem' }}>
              <span>{alert.zone} - {alert.severity}</span>
              <span style={{ fontSize: '0.75rem', color: '#757575' }}>{alert.time}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9e9e9e' }}>
              {alert.desc}
            </div>
          </div>
        ))
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#757575' }}>
          <span className="material-icons" style={{ fontSize: '48px', color: '#4CAF50' }}>check_circle</span>
          <div style={{ marginTop: '16px' }}>All clear — no active alerts</div>
        </div>
      )}
    </div>
  )
}
