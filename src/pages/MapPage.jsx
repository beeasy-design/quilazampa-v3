import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import { PawPrint, Search, X, MapPin } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Icona personalizzata per le aree cani
const createDogIcon = (count, color = '#F97316') => L.divIcon({
  className: '',
  html: `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
      <div style="width:44px;height:44px;border-radius:50%;background:${color};border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:20px;">
        🐾
      </div>
      <div style="position:absolute;top:-6px;right:-6px;background:white;color:${color};
        font-size:10px;font-weight:900;width:18px;height:18px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;border:2px solid ${color};">
        ${count}
      </div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;
        border-top:8px solid ${color};margin-top:-2px;"></div>
    </div>`,
  iconSize: [44, 56],
  iconAnchor: [22, 56],
  popupAnchor: [0, -56],
})

const AREA_COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B']

function RecenterMap({ center }) {
  const map = useMap()
  useEffect(() => { map.setView(center, 14) }, [center])
  return null
}

export default function MapPage({ onAreaSelect }) {
  const [areas, setAreas] = useState([])
  const [areaStats, setAreaStats] = useState({})
  const [search, setSearch] = useState('')
  const [center, setCenter] = useState([45.4654, 9.1859]) // Milano default

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    // Prova geolocalizzazione
    navigator.geolocation?.getCurrentPosition(pos => {
      setCenter([pos.coords.latitude, pos.coords.longitude])
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
    a.city?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100 flex-shrink-0">
        <h2 className="font-bold text-gray-900 text-base text-center mb-2">Mappa Aree Cani</h2>
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
          <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cerca area o città..."
            className="flex-1 bg-transparent text-sm outline-none" />
          {search && <button onClick={() => setSearch('')}><X className="w-4 h-4 text-gray-400" /></button>}
        </div>
      </div>

      {/* Mappa */}
      <div className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap center={center} />
          {filtered.map((area, i) => {
            if (!area.lat || !area.lng) return null
            const count = areaStats[area.id] || 0
            const color = AREA_COLORS[i % AREA_COLORS.length]
            return (
              <Marker key={area.id} position={[area.lat, area.lng]} icon={createDogIcon(count, color)}>
                <Popup>
                  <div className="min-w-[180px]">
                    <div className="font-bold text-sm text-gray-900 mb-1">{area.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                      <MapPin className="w-3 h-3" /> {area.city}
                      {area.fenced && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">RECINTATA</span>}
                    </div>
                    <div className="text-xs text-orange-600 font-bold mb-2">🐾 {count} cani presenti</div>
                    <button onClick={() => onAreaSelect(area)}
                      className="w-full text-white text-xs font-bold py-1.5 rounded-lg"
                      style={{ background: 'linear-gradient(135deg, #84CC16, #65A30D)' }}>
                      SONO QUI
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      {/* Lista aree sotto la mappa */}
      <div className="bg-white border-t border-gray-200 flex-shrink-0" style={{ maxHeight: '180px', overflowY: 'auto' }}>
        {filtered.map((area, i) => (
          <button key={area.id} onClick={() => onAreaSelect(area)}
            className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-orange-50 text-left">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
              style={{ backgroundColor: AREA_COLORS[i % AREA_COLORS.length] + '20', color: AREA_COLORS[i % AREA_COLORS.length] }}>
              🐾
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{area.name}</p>
              <p className="text-xs text-gray-500">{area.city} • {areaStats[area.id] || 0} cani</p>
            </div>
            {area.fenced && <span className="text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full flex-shrink-0">RECINTATA</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
