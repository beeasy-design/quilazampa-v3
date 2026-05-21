import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, X, MapPin, PawPrint, Navigation } from 'lucide-react'

const AREA_COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B', '#EC4899', '#14B8A6']

export default function MapPage({ onAreaSelect }) {
  const [areas, setAreas] = useState([])
  const [areaStats, setAreaStats] = useState({})
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [mapCenter, setMapCenter] = useState({ lat: 45.4654, lng: 9.1859 })

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    navigator.geolocation?.getCurrentPosition(pos => {
      setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    })
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

  // Costruisce URL mappa con marker per tutte le aree
  const buildMapUrl = () => {
    const center = selected
      ? `${selected.lat},${selected.lng}`
      : `${mapCenter.lat},${mapCenter.lng}`
    const zoom = selected ? 15 : 13

    // Markers per ogni area (max 5 per non sovraccaricare)
    const markers = areas.slice(0, 8).map((a, i) => {
      if (!a.lat || !a.lng) return ''
      const color = ['red', 'blue', 'green', 'orange', 'purple', 'yellow', 'pink', 'teal'][i % 8]
      return `marker=${a.lat},${a.lng},${color}`
    }).filter(Boolean).join('&')

    return `https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lng - 0.05},${mapCenter.lat - 0.03},${mapCenter.lng + 0.05},${mapCenter.lat + 0.03}&layer=mapnik&${markers}`
  }

  // Apri in Google Maps
  const openInMaps = (area) => {
    window.open(`https://www.google.com/maps?q=${area.lat},${area.lng}`, '_blank')
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

      {/* Mappa OpenStreetMap via iframe */}
      <div style={{ flex: '1', minHeight: '280px', position: 'relative' }}>
        <iframe
          key={selected?.id || 'default'}
          src={buildMapUrl()}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Mappa aree cani"
          loading="lazy"
        />
        {/* Overlay pin cliccabili sopra la mappa */}
        <div style={{
          position: 'absolute', bottom: 8, right: 8,
          background: 'white', borderRadius: 12, padding: '6px 10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: 11, fontWeight: 700, color: '#374151'
        }}>
          {areas.length} aree • {Object.values(areaStats).reduce((a,b)=>a+b,0)} cani ora
        </div>
      </div>

      {/* Lista aree con pin colorati */}
      <div className="bg-white border-t border-gray-200 flex-shrink-0" style={{ maxHeight: '220px', overflowY: 'auto' }}>
        {filtered.map((area, i) => {
          const count = areaStats[area.id] || 0
          const color = AREA_COLORS[i % AREA_COLORS.length]
          const isSelected = selected?.id === area.id
          return (
            <div key={area.id}
              className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 ${isSelected ? 'bg-orange-50' : ''}`}>
              {/* Pin colorato */}
              <button
                onClick={() => setSelected(isSelected ? null : area)}
                className="flex-shrink-0"
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: color + '20', border: `2px solid ${color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16
                }}>
                  🐾
                </div>
              </button>

              {/* Info area */}
              <button onClick={() => onAreaSelect(area)} className="flex-1 text-left min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{area.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> {area.city}
                  <span style={{ color }}>• 🐾 {count} cani</span>
                  {area.fenced && <span className="text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">RECINTATA</span>}
                </p>
              </button>

              {/* Bottoni azione */}
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => openInMaps(area)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: '#DBEAFE' }}
                  title="Apri in Google Maps"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                </button>
                <button
                  onClick={() => onAreaSelect(area)}
                  className="px-2 py-1 rounded-lg text-white text-[10px] font-bold"
                  style={{ background: 'linear-gradient(135deg, #84CC16, #65A30D)' }}
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
