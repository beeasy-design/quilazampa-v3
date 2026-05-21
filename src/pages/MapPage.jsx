import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Search, X, MapPin, PawPrint } from 'lucide-react'

const AREA_COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B', '#EC4899', '#14B8A6']

export default function MapPage({ onAreaSelect }) {
  const [areas, setAreas] = useState([])
  const [areaStats, setAreaStats] = useState({})
  const [search, setSearch] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => { initMap() }, [])

  useEffect(() => {
    if (mapReady && areas.length > 0) updateMarkers()
  }, [mapReady, areas, areaStats])

  const fetchData = async () => {
    const { data: areasData } = await supabase.from('dog_areas').select('*')
    const { data: checkins } = await supabase.from('checkins').select('area_id').eq('active', true)
    const stats = {}
    checkins?.forEach(c => { stats[c.area_id] = (stats[c.area_id] || 0) + 1 })
    setAreas(areasData || [])
    setAreaStats(stats)
  }

  const initMap = async () => {
    if (mapInstanceRef.current) return
    const L = (await import('leaflet')).default
    await import('leaflet/dist/leaflet.css')
    if (!mapRef.current) return

    const map = L.map(mapRef.current, { center: [45.4654, 9.1859], zoom: 13 })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    mapInstanceRef.current = map
    setMapReady(true)

    navigator.geolocation?.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords
      map.setView([lat, lng], 14)
      L.marker([lat, lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;background:#10B981;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(16,185,129,0.3)"></div>`,
          iconSize: [14, 14], iconAnchor: [7, 7]
        })
      }).addTo(map)
    })
  }

  const updateMarkers = async () => {
    const L = (await import('leaflet')).default
    if (!mapInstanceRef.current) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    areas.forEach((area, i) => {
      if (!area.lat || !area.lng) return
      const count = areaStats[area.id] || 0
      const color = AREA_COLORS[i % AREA_COLORS.length]

      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer">
          <div style="width:44px;height:44px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:20px;">🐾</div>
          <div style="position:absolute;top:-6px;right:-6px;background:white;color:${color};font-size:10px;font-weight:900;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid ${color}">${count}</div>
          <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid ${color};margin-top:-2px"></div>
        </div>`,
        iconSize: [44, 58], iconAnchor: [22, 58], popupAnchor: [0, -60]
      })

      const marker = L.marker([area.lat, area.lng], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<div style="min-width:180px;font-family:system-ui,sans-serif">
          <div style="font-weight:800;font-size:14px;margin-bottom:4px">${area.name}</div>
          <div style="font-size:11px;color:#666;margin-bottom:6px">📍 ${area.city}${area.fenced ? ' • <b style="color:#065f46">RECINTATA</b>' : ''}</div>
          <div style="font-size:12px;color:#f97316;font-weight:700;margin-bottom:8px">🐾 ${count} cani presenti</div>
          <button onclick="window.__qs('${area.id}')" style="width:100%;background:linear-gradient(135deg,#84CC16,#65A30D);color:white;border:none;padding:7px;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer">SONO QUI</button>
        </div>`)

      markersRef.current.push(marker)
    })

    window.__qs = (id) => {
      const area = areas.find(a => a.id === id)
      if (area) onAreaSelect(area)
    }
  }

  const filtered = areas.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.city || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100 flex-shrink-0">
        <h2 className="font-bold text-gray-900 text-base text-center mb-2">Mappa Aree Cani</h2>
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
          <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cerca area o città..." className="flex-1 bg-transparent text-sm outline-none" />
          {search && <button onClick={() => setSearch('')}><X className="w-4 h-4 text-gray-400" /></button>}
        </div>
      </div>

      <div style={{ flex: '1', minHeight: '380px', position: 'relative' }}>
        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
        {!mapReady && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4' }}>
            <div className="text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-sm text-gray-600 font-medium">Caricamento mappa...</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-t border-gray-200 flex-shrink-0" style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {filtered.map((area, i) => (
          <button key={area.id} onClick={() => onAreaSelect(area)}
            className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-orange-50 text-left">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0"
              style={{ backgroundColor: AREA_COLORS[i % AREA_COLORS.length] + '20' }}>🐾</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{area.name}</p>
              <p className="text-xs text-gray-500">{area.city} • {areaStats[area.id] || 0} cani ora</p>
            </div>
            {area.fenced && <span className="text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full flex-shrink-0">RECINTATA</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
