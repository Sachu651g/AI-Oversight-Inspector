import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function RiskMap() {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Initialize map centered on Chennai
    const map = L.map(containerRef.current).setView([13.0827, 80.2707], 11)

    // Add dark theme tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map)

    // Add sample zones with risk colors
    const zones = [
      { name: 'Zone 1', coords: [[13.05, 80.25], [13.05, 80.28], [13.08, 80.28], [13.08, 80.25]], risk: 'low' },
      { name: 'Zone 2', coords: [[13.08, 80.25], [13.08, 80.28], [13.11, 80.28], [13.11, 80.25]], risk: 'medium' },
      { name: 'Zone 3', coords: [[13.05, 80.28], [13.05, 80.31], [13.08, 80.31], [13.08, 80.28]], risk: 'high' },
      { name: 'Zone 4', coords: [[13.08, 80.28], [13.08, 80.31], [13.11, 80.31], [13.11, 80.28]], risk: 'critical' }
    ]

    zones.forEach(zone => {
      const color = zone.risk === 'critical' ? '#F44336' : 
                    zone.risk === 'high' ? '#FF9800' : 
                    zone.risk === 'medium' ? '#FFC107' : '#4CAF50'
      
      L.polygon(zone.coords as L.LatLngExpression[], {
        color: color,
        fillColor: color,
        fillOpacity: 0.3,
        weight: 2
      }).addTo(map).bindPopup(`<b>${zone.name}</b><br>Risk: ${zone.risk}`)
    })

    mapRef.current = map

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      style={{
        height: '400px',
        background: '#212121',
        borderRadius: '6px',
        position: 'relative'
      }}
    />
  )
}
