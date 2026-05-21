import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const TRAITS = ['Socievole', 'Energico', 'Tranquillo', 'Giocoso', 'Timido', 'Protettivo', 'Curioso', 'Indipendente']

export default function OnboardingPage() {
  const { user, refreshDogs } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dog, setDog] = useState({ name: '', breed: '', age: '', gender: 'M', size: 'Media', energy: 'Media', traits: [] })

  const toggleTrait = (t) => setDog(d => ({ ...d, traits: d.traits.includes(t) ? d.traits.filter(x => x !== t) : [...d.traits, t] }))

  const handleSave = async () => {
    setLoading(true); setError('')
    if (!dog.name.trim()) { setError('Inserisci il nome del cane'); setLoading(false); return }
    // Garantisce che il profilo esista sempre
    await supabase.from('profiles').upsert({ id: user.id, username: user.email.split('@')[0], city: '' })
    const { error } = await supabase.from('dogs').insert({
      owner_id: user.id, name: dog.name.trim(), breed: dog.breed.trim(),
      age: parseInt(dog.age) || null, gender: dog.gender,
      size: dog.size, energy: dog.energy, traits: dog.traits,
    })
    if (error) { setError(error.message); setLoading(false); return }
    refreshDogs()
    setLoading(false)
  }

  const steps = [
    { title: 'Benvenuto!', subtitle: 'Aggiungiamo il tuo amico a quattro zampe 🐾' },
    { title: 'Chi è il tuo cane?', subtitle: 'Nome, razza ed età' },
    { title: 'Come è fatto?', subtitle: 'Taglia, energia e carattere' },
    { title: 'Tutto pronto!', subtitle: 'Il profilo è completo ✅' },
  ]

  return (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(135deg, #FEF3C7, #FED7AA, #DBEAFE)' }}>
      <div className="px-6 pt-10 pb-4 flex items-center gap-3">
        {step > 0 && <button onClick={() => setStep(step - 1)}><ChevronLeft className="w-5 h-5 text-gray-700" /></button>}
        <div className="flex-1 flex gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= step ? 'bg-orange-500' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <h1 className="text-2xl font-black text-gray-900 mb-1">{steps[step].title}</h1>
        <p className="text-sm text-gray-600 mb-6">{steps[step].subtitle}</p>

        {step === 0 && (
          <div className="text-center space-y-4">
            <div className="text-8xl">🐕</div>
            <div className="bg-white rounded-2xl p-5 shadow-md text-left space-y-3">
              {[
                { icon: '🗺️', t: 'Vedi le aree cani vicine in tempo reale' },
                { icon: '🤝', t: 'Scopri quali cani sono compatibili col tuo' },
                { icon: '📍', t: 'Fai check-in e fatti trovare dagli altri' },
                { icon: '💬', t: 'Connettiti con i proprietari della tua zona' },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-xl">{b.icon}</div>
                  <p className="text-sm text-gray-800">{b.t}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-28 h-28 rounded-full flex items-center justify-center text-6xl shadow-lg"
                style={{ background: 'linear-gradient(135deg, #FED7AA, #FB923C)' }}>🐕</div>
            </div>
            {[
              { key: 'name', label: 'Nome del cane *', placeholder: 'es. Rocky', type: 'text' },
              { key: 'breed', label: 'Razza', placeholder: 'es. Labrador, Meticcio...', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">{f.label}</label>
                <input type={f.type} value={dog[f.key]} onChange={e => setDog(d => ({ ...d, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none bg-white" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Età (anni)</label>
                <input type="number" min="0" max="20" value={dog.age} onChange={e => setDog(d => ({ ...d, age: e.target.value }))}
                  placeholder="es. 3"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none bg-white" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Sesso</label>
                <div className="flex gap-2">
                  {['M', 'F'].map(g => (
                    <button key={g} type="button" onClick={() => setDog(d => ({ ...d, gender: g }))}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${dog.gender === g ? 'text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600'}`}
                      style={dog.gender === g ? { background: 'linear-gradient(135deg, #F97316, #EA580C)' } : {}}>
                      {g === 'M' ? '♂ M' : '♀ F'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            {[
              { key: 'size', label: 'Taglia', opts: ['Piccola', 'Media', 'Grande'] },
              { key: 'energy', label: 'Livello di energia', opts: ['Bassa', 'Media', 'Alta'] },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-bold text-gray-700 block mb-2">{f.label}</label>
                <div className="grid grid-cols-3 gap-2">
                  {f.opts.map(o => (
                    <button key={o} type="button" onClick={() => setDog(d => ({ ...d, [f.key]: o }))}
                      className={`py-3 rounded-xl text-sm font-bold transition-all ${dog[f.key] === o ? 'text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600'}`}
                      style={dog[f.key] === o ? { background: 'linear-gradient(135deg, #F97316, #EA580C)' } : {}}>{o}</button>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">Carattere</label>
              <div className="flex flex-wrap gap-2">
                {TRAITS.map(t => (
                  <button key={t} type="button" onClick={() => toggleTrait(t)}
                    className={`px-3 py-2 rounded-full text-xs font-bold transition-all ${dog.traits.includes(t) ? 'text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600'}`}
                    style={dog.traits.includes(t) ? { background: 'linear-gradient(135deg, #F97316, #EA580C)' } : {}}>
                    {dog.traits.includes(t) && '✓ '}{t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-6 space-y-5">
            <div className="text-7xl animate-bounce">🎉</div>
            <div className="bg-white rounded-2xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: 'linear-gradient(135deg, #FED7AA, #FB923C)' }}>🐕</div>
                <div className="text-left">
                  <h3 className="font-black text-lg text-gray-900">{dog.name || 'Il tuo cane'}</h3>
                  <p className="text-xs text-gray-600">{dog.breed || 'Razza non specificata'} • {dog.age ? dog.age + ' anni' : ''} • {dog.gender === 'M' ? '♂' : '♀'}</p>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {dog.traits.slice(0, 3).map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}
          </div>
        )}
      </div>

      <div className="px-6 pb-8">
        {step < 3 ? (
          <button onClick={() => setStep(step + 1)} disabled={step === 1 && !dog.name.trim()}
            className="w-full text-white font-bold py-4 rounded-xl shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            {step === 0 ? 'Inizia' : 'Continua'} <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={handleSave} disabled={loading}
            className="w-full text-white font-bold py-4 rounded-xl shadow-md active:scale-95 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #84CC16, #65A30D)' }}>
            {loading ? '⏳ Salvataggio...' : '🐾 Vai all\'app!'}
          </button>
        )}
      </div>
    </div>
  )
}
