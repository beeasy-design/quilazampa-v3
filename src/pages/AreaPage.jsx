import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { ChevronLeft, PawPrint, MapPin, Star, Eye, EyeOff, ChevronRight, MessageCircle } from 'lucide-react'

function calcCompat(a, b) {
  if (!a || !b) return 50
  let s = 50
  if (a.size === b.size) s += 10
  const em = { Bassa: 1, Media: 2, Alta: 3 }
  const d = Math.abs((em[a.energy] || 2) - (em[b.energy] || 2))
  s += d === 0 ? 15 : d === 1 ? 7 : 0
  const common = (a.traits || []).filter(t => (b.traits || []).includes(t))
  s += Math.min(common.length * 5, 25)
  return Math.min(s, 99)
}

const EMOJIS = ['🐕', '🐶', '🦮', '🐕‍🦺', '🐩', '🦴', '🐾']

export default function AreaPage({ area, onBack, onChat }) {
  const { user, dogs } = useAuth()
  const myDog = dogs[0] || null
  const [present, setPresent] = useState([])
  const [checkinId, setCheckinId] = useState(null)
  const [invisible, setInvisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchPresent()
    checkIn()
    const ch = supabase.channel(`area-${area.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins', filter: `area_id=eq.${area.id}` }, fetchPresent)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [area.id])

  const fetchPresent = async () => {
    const { data } = await supabase.from('checkins')
      .select('id, dog_id, checked_in_at, dogs(id,name,breed,age,gender,size,energy,traits,owner_id)')
      .eq('area_id', area.id).eq('active', true)
    setPresent(data || [])
    setLoading(false)
  }

  const checkIn = async () => {
    if (!myDog) return
    const { data } = await supabase.from('checkins').select('id')
      .eq('dog_id', myDog.id).eq('area_id', area.id).eq('active', true).single()
    if (data) setCheckinId(data.id)
  }

  const handleCheckin = async () => {
    if (!myDog) return
    setBusy(true)
    if (checkinId) {
      await supabase.from('checkins').update({ active: false, checked_out_at: new Date().toISOString() }).eq('id', checkinId)
      setCheckinId(null)
    } else {
      await supabase.from('checkins').update({ active: false, checked_out_at: new Date().toISOString() })
        .eq('dog_id', myDog.id).eq('active', true)
      const { data } = await supabase.from('checkins').insert({ dog_id: myDog.id, area_id: area.id, active: true }).select().single()
      if (data) setCheckinId(data.id)
    }
    await fetchPresent()
    setBusy(false)
  }

  const elapsed = (ts) => {
    const m = Math.floor((Date.now() - new Date(ts)) / 60000)
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`
  }

  const visible = invisible ? present.filter(c => c.dogs?.owner_id !== user?.id) : present

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={onBack}><ChevronLeft className="w-6 h-6 text-gray-700" /></button>
        <div className="text-center flex-1 mx-2">
          <div className="flex items-center justify-center gap-1.5">
            <h2 className="font-bold text-sm text-gray-900 truncate">{area.name}</h2>
            {area.fenced && <span className="text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">REC.</span>}
          </div>
          <p className="text-[10px] text-gray-500">{present.length} cani • {area.city}</p>
        </div>
        <Star className="w-6 h-6 text-gray-400" />
      </div>

      <div className="bg-white flex border-b border-gray-200">
        <button className="flex-1 py-3 text-sm font-bold border-b-2 border-orange-500 text-orange-600">
          CANI PRESENTI ({present.length})
        </button>
        <button className="flex-1 py-3 text-sm font-medium text-gray-500">ATTIVITÀ</button>
      </div>

      <div className="bg-amber-50 px-4 py-2 flex items-center justify-between border-b border-amber-100">
        <div className="flex items-center gap-2 text-xs text-amber-900">
          {invisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>Modalità invisibile</span>
        </div>
        <button onClick={() => setInvisible(!invisible)}
          className={`w-10 h-5 rounded-full relative transition-colors ${invisible ? 'bg-green-500' : 'bg-gray-300'}`}>
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${invisible ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && <div className="text-center py-8 text-gray-500 text-sm">Caricamento...</div>}
        {!loading && visible.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🐾</div>
            <p className="font-semibold text-gray-700">Nessun cane presente</p>
            <p className="text-xs text-gray-500 mt-1">Sii il primo a fare check-in!</p>
          </div>
        )}
        {visible.map((c, i) => {
          const dog = c.dogs; if (!dog) return null
          const isMe = dog.owner_id === user?.id
          const compat = calcCompat(myDog, dog)
          const compatColor = compat >= 75 ? '#10B981' : compat >= 60 ? '#F97316' : '#EF4444'
          return (
            <div key={c.id} className={`bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm ${isMe ? 'border-2 border-orange-200' : ''}`}>
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-2xl">
                  {EMOJIS[i % EMOJIS.length]}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-gray-900">{dog.name}</h3>
                  <span className="text-xs">{dog.gender === 'M' ? '♂' : '♀'}</span>
                  {isMe && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 rounded-full font-bold">TU</span>}
                </div>
                <p className="text-xs text-gray-600">{dog.breed} • {dog.age ? dog.age + 'a' : ''}</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {(dog.traits || []).slice(0, 2).map((t, j) => (
                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">{t}</span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">Qui da {elapsed(c.checked_in_at)}</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                {!isMe && (
                  <>
                    <div className="text-xl font-black" style={{ color: compatColor }}>{compat}%</div>
                    <p className="text-[9px] text-gray-500">Compat.</p>
                    {onChat && (
                      <button onClick={() => onChat(dog.owner_id)}
                        className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-blue-500" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white px-4 py-3 border-t border-gray-100">
        {!myDog ? (
          <p className="text-center text-sm text-gray-600 py-1">⚠️ Aggiungi un cane dal profilo per fare check-in</p>
        ) : (
          <button onClick={handleCheckin} disabled={busy}
            className="w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-60"
            style={{ background: checkinId ? 'linear-gradient(135deg, #6B7280, #4B5563)' : 'linear-gradient(135deg, #84CC16, #65A30D)' }}>
            <PawPrint className="w-5 h-5" fill="white" />
            {busy ? 'Attendere...' : checkinId ? `${myDog.name} è qui ✓ — Esci` : `SONO QUI con ${myDog.name}`}
          </button>
        )}
      </div>
    </div>
  )
}
