import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { PawPrint, Shield, ChevronRight, Bell, Settings, Edit3, Plus, LogOut, Crown } from 'lucide-react'

const TRAITS = ['Socievole', 'Energico', 'Tranquillo', 'Giocoso', 'Timido', 'Protettivo', 'Curioso', 'Indipendente']

export default function ProfilePage({ onAddDog, onAdminPanel }) {
  const { user, profile, dogs, isAdmin, signOut, refreshDogs } = useAuth()
  const [editingDog, setEditingDog] = useState(null)
  const [saving, setSaving] = useState(false)

  const updateDog = async (id, updates) => {
    setSaving(true)
    await supabase.from('dogs').update(updates).eq('id', id)
    refreshDogs()
    setEditingDog(null)
    setSaving(false)
  }

  const deleteDog = async (id) => {
    if (!confirm('Rimuovere questo cane?')) return
    await supabase.from('dogs').delete().eq('id', id)
    refreshDogs()
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100">
        <h2 className="font-bold text-gray-900 text-base text-center">Profilo</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="px-4 pt-5 pb-4 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }}>
          <div className="absolute -right-6 -top-6 text-9xl opacity-10">🐾</div>
          <div className="flex items-center gap-3 relative">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl border-2 border-white/40">
              {isAdmin ? '👑' : '👤'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg">{profile?.username || user?.email?.split('@')[0]}</h2>
                {isAdmin && <Crown className="w-4 h-4 text-yellow-300" fill="#fde68a" />}
                <Shield className="w-4 h-4 text-blue-200" />
              </div>
              <p className="text-xs text-blue-100">{profile?.city || 'Città non impostata'}</p>
              <p className="text-xs text-blue-200">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Admin panel button */}
        {isAdmin && (
          <div className="px-4 mt-3">
            <button onClick={onAdminPanel}
              className="w-full text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md"
              style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }}>
              <Crown className="w-5 h-5" /> Pannello Admin
            </button>
          </div>
        )}

        {/* Cani */}
        <div className="px-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900 text-sm">I miei cani</h3>
            <button onClick={onAddDog} className="flex items-center gap-1 text-xs text-orange-600 font-bold">
              <Plus className="w-4 h-4" /> Aggiungi
            </button>
          </div>
          {dogs.length === 0 ? (
            <button onClick={onAddDog} className="w-full bg-white border-2 border-dashed border-orange-300 rounded-2xl p-5 flex flex-col items-center gap-2 hover:bg-orange-50">
              <div className="text-4xl">🐕</div>
              <p className="font-semibold text-gray-700 text-sm">Aggiungi il tuo primo cane</p>
            </button>
          ) : (
            <div className="space-y-3">
              {dogs.map(dog => (
                <div key={dog.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {editingDog === dog.id ? (
                    <DogEditForm dog={dog} onSave={u => updateDog(dog.id, u)} onCancel={() => setEditingDog(null)} saving={saving} />
                  ) : (
                    <div className="p-4 flex items-start gap-3">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #FED7AA, #FB923C)' }}>🐕</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-lg text-gray-900">{dog.name}</h3>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingDog(dog.id)} className="text-orange-500 text-xs font-bold">MODIFICA</button>
                            <button onClick={() => deleteDog(dog.id)} className="text-red-400 text-xs font-bold">RIMUOVI</button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">{dog.breed || 'Razza sconosciuta'} • {dog.age ? dog.age + ' anni' : ''} • {dog.gender === 'M' ? '♂' : '♀'}</p>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {dog.size && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Taglia {dog.size}</span>}
                          {dog.energy && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">Energia {dog.energy}</span>}
                          {(dog.traits || []).slice(0, 2).map((t, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Menu */}
        <div className="px-4 mt-4 mb-4">
          <div className="bg-white rounded-2xl divide-y divide-gray-100">
            {[
              { icon: Bell, label: 'Notifiche', sub: 'Personalizza avvisi' },
              { icon: Shield, label: 'Privacy', sub: 'Modalità invisibile, dati' },
              { icon: Settings, label: 'Impostazioni', sub: 'Account, lingua' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <button key={i} className="w-full flex items-center gap-3 p-3 text-left">
                  <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center"><Icon className="w-4 h-4 text-orange-500" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    <p className="text-[10px] text-gray-500">{item.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              )
            })}
            <button onClick={signOut} className="w-full flex items-center gap-3 p-3">
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center"><LogOut className="w-4 h-4 text-red-500" /></div>
              <p className="text-sm font-semibold text-red-600">Esci dall'account</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DogEditForm({ dog, onSave, onCancel, saving }) {
  const [form, setForm] = useState({ name: dog.name || '', breed: dog.breed || '', age: dog.age || '', gender: dog.gender || 'M', size: dog.size || 'Media', energy: dog.energy || 'Media', traits: dog.traits || [] })
  const toggle = (t) => setForm(f => ({ ...f, traits: f.traits.includes(t) ? f.traits.filter(x => x !== t) : [...f.traits, t] }))
  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold text-gray-600 block mb-1">Nome</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-600 block mb-1">Razza</label>
          <input value={form.breed} onChange={e => setForm(f => ({ ...f, breed: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-600 block mb-1">Carattere</label>
        <div className="flex flex-wrap gap-1">
          {TRAITS.map(t => (
            <button key={t} type="button" onClick={() => toggle(t)}
              className={`px-2 py-1 rounded-full text-[10px] font-bold ${form.traits.includes(t) ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{t}</button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(form)} disabled={saving}
          className="flex-1 py-2 rounded-xl text-white text-sm font-bold"
          style={{ background: 'linear-gradient(135deg, #84CC16, #65A30D)' }}>
          {saving ? '...' : 'Salva'}
        </button>
        <button onClick={onCancel} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600">Annulla</button>
      </div>
    </div>
  )
}
