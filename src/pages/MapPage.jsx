import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, X, MapPin, Navigation } from 'lucide-react'

const AREA_COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B', '#EC4899', '#14B8A6']

export default function MapPage({ onAreaSelect }) {
  const [areas, setAreas] = useState([])
  const [areaStats, setAreaStats] = useState({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    const { data: areasData } = await supabase.from('dog_areas').select('*')
    const { data: checkins } = await supabase.from('checkins').select('area_id').eq('active', true)
    const stats = {}
    checkins?.forEach(c => { stats[c.area_id] = (stats[c.area_id] || 0) + 1 })
    setAreas(areasData || [])
    setAreaStats(stats)
  }

  const filtered = areas.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.city || '').toLowerCase().includes(search.toLowerCase())
  )

  const openInMaps = (area) => {
    window.open(`https://www.google.com/maps?q=${area.lat},${area.lng}&z=16`, '_blank')
  }

  const openAllInMaps = () => {
    if (areas.length === 0) return
    const first = areas[0]
    window.open(`https://www.google.com/maps/search/aree+cani/@${first.lat},${first.lng},13z`, '_blank')
  }

  // Costruisce mappa statica con tutti i pin usando Google Static Maps
  const buildStaticMapUrl = () => {
    const base = 'https://maps.googleapis.com/maps/api/staticmap'
    const center = '45.4654,9.1859'
    const size = '400x350'
    const markers = areas.slice(0, 8).map((a, i) => {
      const colors = ['red', 'blue', 'green', 'purple', 'orange', 'yellow', 'pink', 'white']
      return `markers=color:${colors[i % colors.length]}%7Clabel:${i + 1}%7C${a.lat},${a.lng}`
    }).join('&')
    return null // Google Static Maps richiede API key, usiamo alternativa
  }

  // Mappa SVG interattiva custom
  const MapSVG = () => {
    const totalDogs = Object.values(areaStats).reduce((a, b) => a + b, 0)

    return (
      <div style={{
        width: '100%', height: '100%', background: 'linear-gradient(135deg, #e8f5e9, #e3f2fd)',
        position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center'
      }}>
        {/* Sfondo mappa stilizzato */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4 }}>
          <defs>
            <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mapgrid)" />
          {/* Strade simulate */}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="white" strokeWidth="8" opacity="0.7" />
          <line x1="30%" y1="0" x2="35%" y2="100%" stroke="white" strokeWidth="6" opacity="0.7" />
          <line x1="65%" y1="0" x2="60%" y2="100%" stroke="white" strokeWidth="6" opacity="0.7" />
          <line x1="0" y1="30%" x2="100%" y2="25%" stroke="white" strokeWidth="4" opacity="0.5" />
          <line x1="0" y1="70%" x2="100%" y2="75%" stroke="white" strokeWidth="4" opacity="0.5" />
          {/* Parchi verdi */}
          <rect x="10%" y="15%" width="18%" height="12%" rx="8" fill="#86efac" opacity="0.6" />
          <rect x="55%" y="55%" width="20%" height="14%" rx="8" fill="#86efac" opacity="0.6" />
          <rect x="70%" y="10%" width="15%" height="18%" rx="8" fill="#86efac" opacity="0.6" />
        </svg>

        {/* Pin aree */}
        {areas.slice(0, 8).map((area, i) => {
          const positions = [
            { x: '48%', y: '38%' }, { x: '28%', y: '22%' }, { x: '62%', y: '28%' },
            { x: '35%', y: '58%' }, { x: '68%', y: '52%' }, { x: '20%', y: '65%' },
            { x: '75%', y: '35%' }, { x: '52%', y: '68%' }
          ]
          const pos = positions[i % positions.length]
          const color = AREA_COLORS[i % AREA_COLORS.length]
          const count = areaStats[area.id] || 0

          return (
            <button
              key={area.id}
              onClick={() => onAreaSelect(area)}
              style={{
                position: 'absolute', left: pos.x, top: pos.y,
                transform: 'translate(-50%, -100%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                cursor: 'pointer', zIndex: 10
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '50%', background: color,
                border: '3px solid white', boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, position: 'relative'
              }}>
                🐾
                <div style={{
                  position: 'absolute', top: -8, right: -8,
                  background: 'white', color: color, fontSize: 10, fontWeight: 900,
                  width: 20, height: 20, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                }}>
                  {count}
                </div>
              </div>
              {/* Triangolo pin */}
              <div style={{
                width: 0, height: 0,
                borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
                borderTop: `9px solid ${color}`, marginTop: -2
              }} />
              {/* Etichetta */}
              <div style={{
                background: 'white', borderRadius: 6, padding: '2px 6px',
                fontSize: 9, fontWeight: 700, color: '#374151',
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)', marginTop: 2,
                whiteSpace: 'nowrap', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {area.name.length > 12 ? area.name.substring(0, 10) + '...' : area.name}
              </div>
            </button>
          )
        })}

        {/* Badge in basso */}
        <div style={{
          position: 'absolute', bottom: 10, right: 10,
          background: 'white', borderRadius: 20, padding: '5px 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: 11, fontWeight: 700, color: '#374151',
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          <span>🗺️</span>
          <span>{areas.length} aree</span>
          <span style={{ color: '#F97316' }}>• 🐾 {totalDogs} cani ora</span>
        </div>

        {/* Pulsante apri Google Maps */}
        <button
          onClick={openAllInMaps}
          style={{
            position: 'absolute', bottom: 10, left: 10,
            background: 'white', borderRadius: 20, padding: '5px 12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: 11, fontWeight: 700,
            color: '#3B82F6', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4
          }}
        >
          <Navigation style={{ width: 12, height: 12 }} /> Apri in Maps
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100 flex-shrink-0">
        <h2 className="font-bold text-gray-900 text-base text-center mb-2">Mappa Aree Cani</h2>
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
          <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca area o città..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Mappa SVG interattiva */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <MapSVG />
      </div>

      {/* Lista aree */}
      <div className="bg-white border-t border-gray-200 flex-shrink-0" style={{ maxHeight: '180px', overflowY: 'auto' }}>
        {filtered.map((area, i) => {
          const count = areaStats[area.id] || 0
          const color = AREA_COLORS[i % AREA_COLORS.length]
          return (
            <div key={area.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100">
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: color + '20', border: `2px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
              }}>🐾</div>

              <button onClick={() => onAreaSelect(area)} className="flex-1 text-left min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{area.name}</p>
                <p className="text-xs text-gray-500">
                  {area.city} • <span style={{ color }}>🐾 {count} cani</span>
                  {area.fenced && <span className="ml-1 text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">RECINTATA</span>}
                </p>
              </button>

              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => openInMaps(area)}
                  style={{ width: 30, height: 30, borderRadius: '50%', background: '#DBEAFE', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Apri in Google Maps"
                >
                  <Navigation style={{ width: 13, height: 13, color: '#2563EB' }} />
                </button>
                <button
                  onClick={() => onAreaSelect(area)}
                  style={{ background: 'linear-gradient(135deg,#84CC16,#65A30D)', color: 'white', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  Sono qui
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
