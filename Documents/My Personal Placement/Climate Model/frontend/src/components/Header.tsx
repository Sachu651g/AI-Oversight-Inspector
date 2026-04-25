import { useEffect, useState } from 'react'

interface HeaderProps {
  activeTab: 'simulation' | 'intelligence' | 'response' | 'resources'
  onTabChange: (tab: 'simulation' | 'intelligence' | 'response' | 'resources') => void
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedDistrict, setSelectedDistrict] = useState('Chennai')

  const districts = [
    'Chennai', 'Coimbatore', 'Madurai', 'Visakhapatnam', 'Vijayawada',
    'Bengaluru', 'Mysuru', 'Mangaluru', 'Kochi', 'Thiruvananthapuram'
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const tabs = [
    { id: 'simulation' as const, label: 'SIMULATION' },
    { id: 'intelligence' as const, label: 'INTELLIGENCE' },
    { id: 'response' as const, label: 'RESPONSE' },
    { id: 'resources' as const, label: 'RESOURCES' }
  ]

  return (
    <div style={{
      background: '#1c1b1b',
      padding: '16px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid rgba(64, 71, 82, 0.15)'
    }}>
      {/* LEFT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 300, color: '#9ecaff' }}>
          CLIMATE GUARDIAN
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
          <span className="material-icons" style={{ fontSize: '18px' }}>location_on</span>
          <select 
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#e8e8e8',
              fontSize: '0.875rem',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {districts.map(district => (
              <option key={district} value={district} style={{ background: '#1c1b1b' }}>
                {district}
              </option>
            ))}
          </select>
          <span className="material-icons" style={{ fontSize: '18px' }}>expand_more</span>
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', gap: '24px', fontSize: '0.875rem' }}>
          {tabs.map(tab => (
            <div 
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{ 
                color: activeTab === tab.id ? '#9ecaff' : '#757575', 
                cursor: 'pointer', 
                paddingBottom: '4px',
                borderBottom: activeTab === tab.id ? '2px solid #9ecaff' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
          <span className="material-icons" style={{ fontSize: '18px' }}>schedule</span>
          <span>{currentTime.toLocaleTimeString('en-IN')} IST</span>
        </div>
        <span 
          className="material-icons" 
          style={{ cursor: 'pointer' }}
          onClick={() => alert('Notifications: 3 new alerts')}
        >
          notifications
        </span>
        <span 
          className="material-icons" 
          style={{ cursor: 'pointer' }}
          onClick={() => alert('Settings panel')}
        >
          settings
        </span>
        <div style={{
          width: '32px',
          height: '32px',
          background: '#9ecaff',
          color: '#131313',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 500,
          fontSize: '0.875rem',
          cursor: 'pointer'
        }}
        onClick={() => alert('User profile')}
        >
          AD
        </div>
      </div>
    </div>
  )
}
