import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Heart, MapPin, Phone, Plus, ChevronLeft, X, Filter } from 'lucide-react'

export default function AdoptionsPage() {
  const { user, isAdmin } = useAuth()
  const [dogs, setDogs] = useState([])
  const [saved, setSaved] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState({ size: '', city: '' })
  const [form, setForm] = useState({ name: '', breed: '', age: '', gender: 'M', size: 'Media', city: '', description: '', contact: '', trait: '', emoji: '🐕' })

  useEffect(() => { fetchDogs() }, [])

  const fetchDogs = async () => {
    let q = supabase.from('adoption_dogs').select('*').order('created_at', { ascending: false })
    if (filter.size) q = q.eq('size', filter.size)
    if (filter.city) q = q.ilike('city', `%${filter.city}%`)
    const { data } = await q
    setDogs(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchDogs() }, [filter])

  const handleAdd = async (e) => {
    e.preventDefault()
    await supabase.from('adoption_dogs').insert({ ...form, age: parseInt(form.age) || null, added_by: user.id })
    setShowAdd(false)
    fetchDogs()
    setForm({ name: '', breed: '', age: '', gender: 'M', size: 'Media', city: '', description: '', contact: '', trait: '', emoji: '🐕' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Rimuovere questo cane?')) return
    await supabase.from('adoption_dogs').delete().eq('id', id)
    fetchDogs()
  }

  const toggleSave = (id) => {
    setSaved(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  if (showAdd) return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => setShowAdd(false)}><ChevronLeft className="w-6 h-6 text-gray-700" /></button>
        <h2 className="font-bold text-gray-900">Aggiungi cane in adozione</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Emoji</label>
            <div className="flex gap-2 flex-wrap">
              {['🐕', '🐶', '🦮', '🐕‍🦺', '🐩'].map(em => (
                <button key={em} type="button" onClick={() => setForm(f => ({ ...f, emoji: em }))}
                  className={`w-10 h-10 rounded-xl text-xl ${form.emoji === em ? 'bg-orange-100 ring-2 ring-orange-500' : 'bg-white border border-gray-200'}`}>
                  {em}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">Nome *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">Razza</label>
              <input type="text" value={form.breed} onChange={e => setForm(f => ({ ...f, breed: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">Età</label>
              <input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">Sesso</label>
              <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none">
                <option value="M">♂ M</option>
                <option value="F">♀ F</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">Taglia</label>
              <select value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none">
                {['Piccola', 'Media', 'Grande'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {[
            { key: 'city', label: 'Città *', placeholder: 'es. Milano (MI)' },
            { key: 'trait', label: 'Caratteristica principale', placeholder: 'es. Socievole, Tranquillo...' },
            { key: 'contact', label: 'Contatto', placeholder: 'Email o telefono del canile' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">{f.label}</label>
              <input type="text" value={form[f.key]} onChange={e => setForm(ff => ({ ...ff, [f.key]: e.target.value }))}
                placeholder={f.placeholder} required={f.key === 'city'}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
            </div>
          ))}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Storia del cane</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Racconta la storia di questo cane..." rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none resize-none" />
          </div>
          <button type="submit"
            className="w-full text-white font-bold py-4 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            🐾 Pubblica adozione
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-gray-900 text-base">Cani in adozione</h2>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-xs font-bold text-white px-3 py-1.5 rounded-full"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            <Plus className="w-3 h-3" /> Aggiungi
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {['Tutti', 'Piccola', 'Media', 'Grande'].map(s => (
            <button key={s} onClick={() => setFilter(f => ({ ...f, size: s === 'Tutti' ? '' : s }))}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${(filter.size === s || (s === 'Tutti' && !filter.size)) ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading && <div className="text-center py-8 text-gray-500">Caricamento...</div>}
        {!loading && dogs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🐾</div>
            <p className="font-semibold text-gray-700">Nessun cane in adozione</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 text-sm text-orange-600 font-bold">Aggiungi il primo!</button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {dogs.map((dog, i) => (
            <div key={dog.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="aspect-square flex items-center justify-center text-5xl relative"
                style={{ background: ['linear-gradient(135deg,#FED7AA,#FB923C)', 'linear-gradient(135deg,#DDD6FE,#A78BFA)', 'linear-gradient(135deg,#BBF7D0,#4ADE80)', 'linear-gradient(135deg,#BFDBFE,#60A5FA)'][i % 4] }}>
                {dog.emoji || '🐕'}
                <button onClick={() => toggleSave(dog.id)}
                  className="absolute top-2 right-2 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center">
                  <Heart className={`w-4 h-4 ${saved.has(dog.id) ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                </button>
                {isAdmin && (
                  <button onClick={() => handleDelete(dog.id)}
                    className="absolute top-2 left-2 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center">
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                )}
                <div className="absolute bottom-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  In cerca di casa ❤️
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-bold text-sm text-gray-900">{dog.name}</h3>
                <p className="text-[10px] text-gray-600">{dog.age ? dog.age + 'a' : ''} • {dog.gender === 'M' ? '♂' : '♀'} • {dog.breed || ''}</p>
                {dog.trait && <span className="inline-block text-[9px] px-1.5 py-0.5 rounded-full mt-1 bg-blue-100 text-blue-700 font-medium">{dog.trait}</span>}
                {dog.city && <p className="text-[9px] text-gray-500 mt-1 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{dog.city}</p>}
                {dog.description && <p className="text-[10px] text-gray-600 mt-1 line-clamp-2">{dog.description}</p>}
                {dog.contact && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-orange-600 font-semibold">
                    <Phone className="w-3 h-3" /> {dog.contact}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
