import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ChevronLeft, Plus, X, Map, Calendar, PawPrint, Users, RefreshCw, Trash2 } from 'lucide-react'

export default function AdminPanel({ onBack }) {
  const [tab, setTab] = useState('aree')
  const [areas, setAreas] = useState([])
  const [events, setEvents] = useState([])
  const [users, setUsers] = useState([])
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)

  // Form aree
  const [areaForm, setAreaForm] = useState({ name: '', lat: '', lng: '', fenced: false, city: '' })
  // Form checkin manuale
  const [ciForm, setCiForm] = useState({ dog_id: '', area_id: '' })
  const [allDogs, setAllDogs] = useState([])

  useEffect(() => { fetchAll() }, [tab])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: a }, { data: e }, { data: p }, { data: ci }, { data: d }] = await Promise.all([
      supabase.from('dog_areas').select('*').order('name'),
      supabase.from('events').select('*').order('date'),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('checkins').select('*, dogs(name), dog_areas(name)').eq('active', true),
      supabase.from('dogs').select('id,name,owner_id,profiles(username)'),
    ])
    setAreas(a || [])
    setEvents(e || [])
    setUsers(p || [])
    setCheckins(ci || [])
    setAllDogs(d || [])
    setLoading(false)
  }

  const addArea = async (e) => {
    e.preventDefault()
    await supabase.from('dog_areas').insert({ ...areaForm, lat: parseFloat(areaForm.lat), lng: parseFloat(areaForm.lng), fenced: Boolean(areaForm.fenced) })
    setAreaForm({ name: '', lat: '', lng: '', fenced: false, city: '' })
    fetchAll()
  }

  const deleteArea = async (id) => {
    if (!confirm('Eliminare area?')) return
    await supabase.from('dog_areas').delete().eq('id', id)
    fetchAll()
  }

  const deleteEvent = async (id) => {
    if (!confirm('Eliminare evento?')) return
    await supabase.from('events').delete().eq('id', id)
    fetchAll()
  }

  const forceCheckout = async (id) => {
    await supabase.from('checkins').update({ active: false, checked_out_at: new Date().toISOString() }).eq('id', id)
    fetchAll()
  }

  const manualCheckin = async (e) => {
    e.preventDefault()
    await supabase.from('checkins').update({ active: false }).eq('dog_id', ciForm.dog_id).eq('active', true)
    await supabase.from('checkins').insert({ dog_id: ciForm.dog_id, area_id: ciForm.area_id, active: true })
    setCiForm({ dog_id: '', area_id: '' })
    fetchAll()
  }

  const TABS = [
    { id: 'aree', icon: Map, label: 'Aree', count: areas.length },
    { id: 'eventi', icon: Calendar, label: 'Eventi', count: events.length },
    { id: 'checkin', icon: PawPrint, label: 'Check-in', count: checkins.length },
    { id: 'utenti', icon: Users, label: 'Utenti', count: users.length },
  ]

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 flex items-center gap-3 border-b border-gray-100"
        style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }}>
        <button onClick={onBack}><ChevronLeft className="w-6 h-6 text-white" /></button>
        <h2 className="font-bold text-white flex-1">👑 Pannello Admin</h2>
        <button onClick={fetchAll} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <RefreshCw className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white flex border-b border-gray-200 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center py-2 px-3 min-w-0 ${tab === t.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-bold">{t.label}</span>
              <span className={`text-[10px] font-black ${tab === t.id ? 'text-blue-600' : 'text-gray-400'}`}>{t.count}</span>
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && <div className="text-center py-8 text-gray-500">Caricamento...</div>}

        {/* AREE */}
        {tab === 'aree' && !loading && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">➕ Aggiungi area cani</h3>
              <form onSubmit={addArea} className="space-y-3">
                <input type="text" value={areaForm.name} onChange={e => setAreaForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nome area *" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={areaForm.lat} onChange={e => setAreaForm(f => ({ ...f, lat: e.target.value }))}
                    placeholder="Latitudine *" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
                  <input type="text" value={areaForm.lng} onChange={e => setAreaForm(f => ({ ...f, lng: e.target.value }))}
                    placeholder="Longitudine *" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
                </div>
                <input type="text" value={areaForm.city} onChange={e => setAreaForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="Città" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="fenced" checked={areaForm.fenced} onChange={e => setAreaForm(f => ({ ...f, fenced: e.target.checked }))} className="w-4 h-4" />
                  <label htmlFor="fenced" className="text-sm text-gray-700">Area recintata</label>
                </div>
                <p className="text-[10px] text-gray-500">💡 Vai su Google Maps → click destro → copia le coordinate lat/lng</p>
                <button type="submit" className="w-full text-white font-bold py-2.5 rounded-xl text-sm"
                  style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }}>
                  Aggiungi area
                </button>
              </form>
            </div>
            <div className="space-y-2">
              {areas.map(a => (
                <div key={a.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{a.name}</p>
                    <p className="text-[10px] text-gray-500">{a.city} • {a.lat?.toFixed(4)}, {a.lng?.toFixed(4)} {a.fenced ? '• RECINTATA' : ''}</p>
                  </div>
                  <button onClick={() => deleteArea(a.id)} className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* CHECK-IN */}
        {tab === 'checkin' && !loading && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">📍 Check-in manuale (simula presenza)</h3>
              <form onSubmit={manualCheckin} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-600 block mb-1">Cane</label>
                  <select value={ciForm.dog_id} onChange={e => setCiForm(f => ({ ...f, dog_id: e.target.value }))} required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm">
                    <option value="">Seleziona cane...</option>
                    {allDogs.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.profiles?.username || 'utente'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-600 block mb-1">Area</label>
                  <select value={ciForm.area_id} onChange={e => setCiForm(f => ({ ...f, area_id: e.target.value }))} required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm">
                    <option value="">Seleziona area...</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full text-white font-bold py-2.5 rounded-xl text-sm"
                  style={{ background: 'linear-gradient(135deg, #84CC16, #65A30D)' }}>
                  Simula check-in
                </button>
              </form>
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Check-in attivi ({checkins.length})</h3>
            {checkins.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Nessun cane presente nelle aree</p>}
            {checkins.map(ci => (
              <div key={ci.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">🐕 {ci.dogs?.name}</p>
                  <p className="text-[10px] text-gray-500">📍 {ci.dog_areas?.name}</p>
                  <p className="text-[10px] text-gray-400">{new Date(ci.checked_in_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <button onClick={() => forceCheckout(ci.id)} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full">
                  Rimuovi
                </button>
              </div>
            ))}
          </>
        )}

        {/* EVENTI */}
        {tab === 'eventi' && !loading && (
          <div className="space-y-2">
            {events.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Nessun evento. Creane uno dalla sezione Eventi.</p>}
            {events.map(ev => (
              <div key={ev.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
                <div className="text-2xl">{ev.emoji || '🐾'}</div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">{ev.title}</p>
                  <p className="text-[10px] text-gray-500">{new Date(ev.date).toLocaleDateString('it-IT')} • {ev.location}</p>
                  <p className="text-[10px] text-orange-600 font-bold">{ev.participants_count || 0}/{ev.max_participants} partecipanti</p>
                </div>
                <button onClick={() => deleteEvent(ev.id)} className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* UTENTI */}
        {tab === 'utenti' && !loading && (
          <div className="space-y-2">
            <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-800 font-medium">
              👑 Admin: admin@quilazampa.it / test@quilazampa.it
            </div>
            {users.map(u => (
              <div key={u.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-lg">👤</div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">{u.username}</p>
                  <p className="text-[10px] text-gray-500">{u.city || 'Città non impostata'}</p>
                  <p className="text-[10px] text-gray-400">{new Date(u.created_at).toLocaleDateString('it-IT')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
