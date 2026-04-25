export default function AuditTrail() {
  const records = [
    { time: '14:40:12', action: 'Manual Override', user: 'AD-092', zone: 'Z4', hash: '0x7f2...a1c' },
    { time: '14:38:45', action: 'Sensor Calibration', user: 'SYS-AUTO', zone: 'Global', hash: '0x2a1...99e' },
    { time: '14:35:22', action: 'Sim Start', user: 'AD-092', zone: 'Alpha-7', hash: '0xd44...f01' }
  ]

  return (
    <div style={{
      background: '#2a2a2a',
      borderRadius: '6px',
      padding: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9e9e9e' }}>
          SYSTEM AUDIT TRAIL
        </div>
        <span style={{
          background: 'rgba(76, 175, 80, 0.2)',
          color: '#81c784',
          padding: '4px 12px',
          borderRadius: '2px',
          fontSize: '0.75rem',
          textTransform: 'uppercase'
        }}>
          BLOCKCHAIN VERIFIED
        </span>
      </div>

      <table style={{ width: '100%', fontSize: '0.875rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '12px 0', borderBottom: '1px solid rgba(64, 71, 82, 0.15)', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', color: '#9e9e9e' }}>
              TIMESTAMP
            </th>
            <th style={{ textAlign: 'left', padding: '12px 0', borderBottom: '1px solid rgba(64, 71, 82, 0.15)', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', color: '#9e9e9e' }}>
              ACTION
            </th>
            <th style={{ textAlign: 'left', padding: '12px 0', borderBottom: '1px solid rgba(64, 71, 82, 0.15)', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', color: '#9e9e9e' }}>
              USER
            </th>
            <th style={{ textAlign: 'left', padding: '12px 0', borderBottom: '1px solid rgba(64, 71, 82, 0.15)', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', color: '#9e9e9e' }}>
              ZONE
            </th>
            <th style={{ textAlign: 'left', padding: '12px 0', borderBottom: '1px solid rgba(64, 71, 82, 0.15)', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', color: '#9e9e9e' }}>
              HASH
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, idx) => (
            <tr key={idx}>
              <td style={{ padding: '12px 0', borderBottom: '1px solid rgba(64, 71, 82, 0.15)' }}>{record.time}</td>
              <td style={{ padding: '12px 0', borderBottom: '1px solid rgba(64, 71, 82, 0.15)' }}>{record.action}</td>
              <td style={{ padding: '12px 0', borderBottom: '1px solid rgba(64, 71, 82, 0.15)' }}>{record.user}</td>
              <td style={{ padding: '12px 0', borderBottom: '1px solid rgba(64, 71, 82, 0.15)' }}>{record.zone}</td>
              <td style={{ padding: '12px 0', borderBottom: '1px solid rgba(64, 71, 82, 0.15)', color: '#757575' }}>{record.hash}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
