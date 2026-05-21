import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Calendar, MapPin, Clock, Users, Plus, ChevronLeft, X } from 'lucide-react'

const EVENT_COLORS = ['#FED7AA', '#DDD6FE', '#BFDBFE', '#BBF7D0', '#FCE7F3', '#FEF3C7']

export default function EventsPage() {
  const { user, isAdmin } = useAuth()
  const [events, setEvents] = useState([])
  const [joined, setJoined] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState('tutti')

  const [form, setForm] = useState({ title: '', date: '', time: '', location: '', description: '', max_participants: 20, emoji: '🐾' })

  useEffect(() => { fetchEvents() }, [])

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('date')
    setEvents(data || [])
    // Partecipazioni utente
    if (user) {
      const { data: parts } = await supabase.from('event_participants').select('event_id').eq('user_id', user.id)
      setJoined(new Set(parts?.map(p => p.event_id) || []))
    }
    setLoading(false)
  }

  const handleJoin = async (eventId) => {
    if (!user) return
    if (joined.has(eventId)) {
      await supabase.from('event_participants').delete().eq('event_id', eventId).eq('user_id', user.id)
      await supabase.from('events').update({ participants_count: supabase.rpc('decrement', { x: 1 }) }).eq('id', eventId)
      setJoined(prev => { const s = new Set(prev); s.delete(eventId); return s })
    } else {
      await supabase.from('event_participants').insert({ event_id: eventId, user_id: user.id })
      setJoined(prev => new Set([...prev, eventId]))
    }
    fetchEvents()
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const dt = new Date(`${form.date}T${form.time}`)
    const { error } = await supabase.from('events').insert({
      title: form.title, date: dt.toISOString(), location: form.location,
      description: form.description, max_participants: parseInt(form.max_participants),
      emoji: form.emoji, participants_count: 0, created_by: user.id
    })
    if (!error) { setShowCreate(false); fetchEvents(); setForm({ title: '', date: '', time: '', location: '', description: '', max_participants: 20, emoji: '🐾' }) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Eliminare questo evento?')) return
    await supabase.from('events').delete().eq('id', id)
    fetchEvents()
  }

  const now = new Date()
  const filtered = events.filter(ev => {
    const evDate = new Date(ev.date)
    if (filter === 'prossimi') return evDate >= now
    if (filter === 'passati') return evDate < now
    return true
  })

  if (showCreate) return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => setShowCreate(false)}><ChevronLeft className="w-6 h-6 text-gray-700" /></button>
        <h2 className="font-bold text-gray-900">Crea evento</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Emoji evento</label>
            <div className="flex gap-2 flex-wrap">
              {['🐾', '🌅', '🐶', '🎉', '🏆', '🎓', '🍹', '🌳', '🤝', '❤️'].map(em => (
                <button key={em} type="button" onClick={() => setForm(f => ({ ...f, emoji: em }))}
                  className={`w-10 h-10 rounded-xl text-xl ${form.emoji === em ? 'bg-orange-100 ring-2 ring-orange-500' : 'bg-white border border-gray-200'}`}>
                  {em}
                </button>
              ))}
            </div>
          </div>
          {[
            { key: 'title', label: 'Titolo evento *', placeholder: 'es. Passeggiata mattutina al Parco' },
            { key: 'location', label: 'Luogo *', placeholder: 'es. Parco Sempione, Milano' },
            { key: 'description', label: 'Descrizione', placeholder: 'Descrivi l\'evento...' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">{f.label}</label>
              {f.key === 'description' ? (
                <textarea value={form[f.key]} onChange={e => setForm(ff => ({ ...ff, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none resize-none" />
              ) : (
                <input type="text" value={form[f.key]} onChange={e => setForm(ff => ({ ...ff, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} required={f.key !== 'description'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
              )}
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">Data *</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">Ora *</label>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Max partecipanti</label>
            <input type="number" value={form.max_participants} onChange={e => setForm(f => ({ ...f, max_participants: e.target.value }))}
              min={2} max={500}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
          </div>
          <button type="submit"
            className="w-full text-white font-bold py-4 rounded-xl shadow-md"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            🎉 Pubblica evento
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-gray-900 text-base">Eventi & Raduni</h2>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 text-xs font-bold text-white px-3 py-1.5 rounded-full"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            <Plus className="w-3 h-3" /> Crea
          </button>
        </div>
        <div className="flex gap-2">
          {['tutti', 'prossimi', 'passati'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize ${filter === f ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading && <div className="text-center py-8 text-gray-500">Caricamento...</div>}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📅</div>
            <p className="font-semibold text-gray-700">Nessun evento trovato</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-orange-600 font-bold">Crea il primo!</button>
          </div>
        )}
        {filtered.map((ev, i) => {
          const isPast = new Date(ev.date) < now
          const isJoined = joined.has(ev.id)
          const isFull = ev.participants_count >= ev.max_participants
          return (
            <div key={ev.id} className={`bg-white rounded-2xl overflow-hidden shadow-sm ${isPast ? 'opacity-70' : ''}`}>
              <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: EVENT_COLORS[i % EVENT_COLORS.length] }}>
                <div className="text-3xl">{ev.emoji || '🐾'}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-gray-900">{ev.title}</h3>
                  <p className="text-[10px] text-gray-700 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(ev.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })} • {new Date(ev.date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDelete(ev.id)} className="w-7 h-7 bg-white/70 rounded-full flex items-center justify-center">
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                )}
              </div>
              <div className="px-4 py-3">
                {ev.description && <p className="text-xs text-gray-600 mb-2">{ev.description}</p>}
                <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {ev.participants_count || 0}/{ev.max_participants} partecipanti
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                  <div className="h-1.5 rounded-full bg-orange-400"
                    style={{ width: `${Math.min(((ev.participants_count || 0) / ev.max_participants) * 100, 100)}%` }} />
                </div>
                {!isPast && (
                  <button onClick={() => handleJoin(ev.id)} disabled={isFull && !isJoined}
                    className="w-full py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                    style={{ background: isJoined ? 'linear-gradient(135deg, #6B7280, #4B5563)' : 'linear-gradient(135deg, #84CC16, #65A30D)' }}>
                    {isJoined ? '✓ Partecipi — Disdici' : isFull ? 'Evento pieno' : '✓ PARTECIPA'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
