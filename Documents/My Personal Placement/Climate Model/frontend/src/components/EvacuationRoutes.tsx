export default function EvacuationRoutes() {
  const routes = [
    { id: 'A', name: 'Western Expressway', status: 'OPEN', statusColor: 'rgba(76, 175, 80, 0.2)', textColor: '#81c784' },
    { id: 'B', name: 'Old Mahabalipuram', status: 'CLEAR', statusColor: 'rgba(33, 150, 243, 0.2)', textColor: '#64b5f6' },
    { id: 'C', name: 'Coastal Bypass', status: 'PARTIAL', statusColor: 'rgba(255, 193, 7, 0.2)', textColor: '#ffd54f' }
  ]

  return (
    <div style={{
      background: '#2a2a2a',
      borderRadius: '6px',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9e9e9e', marginBottom: '16px' }}>
        EVACUATION ROUTES
      </div>
      {routes.map(route => (
        <div key={route.id} style={{
          background: '#353534',
          padding: '16px',
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: '#9ecaff',
              color: '#131313',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 500
            }}>
              {route.id}
            </div>
            <span>{route.name}</span>
          </div>
          <span style={{
            background: route.statusColor,
            color: route.textColor,
            padding: '4px 12px',
            borderRadius: '2px',
            fontSize: '0.75rem'
          }}>
            {route.status}
          </span>
        </div>
      ))}
    </div>
  )
}
