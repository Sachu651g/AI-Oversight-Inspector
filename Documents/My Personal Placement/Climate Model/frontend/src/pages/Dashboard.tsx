import { useState } from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import RiskMap from '../components/RiskMap'
import SimulationPlayer from '../components/SimulationPlayer'
import EvacuationRoutes from '../components/EvacuationRoutes'
import DecisionBrief from '../components/DecisionBrief'
import AlertPanel from '../components/AlertPanel'
import AuditTrail from '../components/AuditTrail'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'simulation' | 'intelligence' | 'response' | 'resources'>('simulation')
  const [simulationData, setSimulationData] = useState<any>(null)
  const [riskData, setRiskData] = useState<any>(null)

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#131313' }}>
      {/* LEFT SIDEBAR */}
      <Sidebar 
        onSimulationComplete={(data) => {
          setSimulationData(data)
        }}
        onRiskUpdate={(data) => {
          setRiskData(data)
        }}
      />

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* HEADER */}
        <Header activeTab={activeTab} onTabChange={setActiveTab} />

        {/* CONTENT BASED ON ACTIVE TAB */}
        {activeTab === 'simulation' && (
          <div style={{ 
            flex: 1, 
            padding: '24px', 
            overflowY: 'auto', 
            display: 'grid', 
            gridTemplateColumns: '2fr 1fr', 
            gap: '24px' 
          }}>
            {/* CENTER COLUMN */}
            <div>
              {/* Critical Alert */}
              {riskData?.criticalZones?.length > 0 && (
                <div style={{
                  background: 'rgba(244, 67, 54, 0.2)',
                  color: '#ffb4ab',
                  padding: '16px',
                  borderRadius: '6px',
                  borderLeft: '4px solid #F44336',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span className="material-icons">warning</span>
                  <span style={{ fontWeight: 500 }}>HIGH RISK: MULTIPLE ZONES</span>
                </div>
              )}

              {/* Map with Simulation Controls */}
              <div style={{ position: 'relative', marginBottom: '24px' }}>
                <RiskMap riskData={riskData} />
                <SimulationPlayer simulationData={simulationData} />
              </div>

              {/* Evacuation Routes */}
              <EvacuationRoutes />

              {/* Audit Trail */}
              <AuditTrail />
            </div>

            {/* RIGHT COLUMN */}
            <div>
              {/* Decision Brief */}
              <DecisionBrief riskData={riskData} />

              {/* Active Alerts */}
              <AlertPanel riskData={riskData} />
            </div>
          </div>
        )}

        {activeTab === 'intelligence' && (
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            <div style={{ 
              background: '#2a2a2a', 
              borderRadius: '6px', 
              padding: '24px',
              textAlign: 'center',
              color: '#9e9e9e'
            }}>
              <span className="material-icons" style={{ fontSize: '64px', marginBottom: '16px' }}>psychology</span>
              <h2>AI Intelligence Hub</h2>
              <p>AI-powered situation analysis and recommendations</p>
            </div>
          </div>
        )}

        {activeTab === 'response' && (
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            <div style={{ 
              background: '#2a2a2a', 
              borderRadius: '6px', 
              padding: '24px',
              textAlign: 'center',
              color: '#9e9e9e'
            }}>
              <span className="material-icons" style={{ fontSize: '64px', marginBottom: '16px' }}>emergency</span>
              <h2>Live Response Feed</h2>
              <p>Real-time emergency response coordination</p>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            <div style={{ 
              background: '#2a2a2a', 
              borderRadius: '6px', 
              padding: '24px',
              textAlign: 'center',
              color: '#9e9e9e'
            }}>
              <span className="material-icons" style={{ fontSize: '64px', marginBottom: '16px' }}>local_library</span>
              <h2>Resources & Helplines</h2>
              <p>Emergency contacts and disaster resources</p>
            </div>
          </div>
        )}
      </div>

      {/* EMERGENCY FAB */}
      <div 
        onClick={() => alert('Emergency alert dispatched!')}
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          width: '56px',
          height: '56px',
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          cursor: 'pointer',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <span className="material-icons" style={{ color: 'white' }}>emergency</span>
      </div>
    </div>
  )
}
