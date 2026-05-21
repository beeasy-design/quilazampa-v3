import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle, MapPin } from 'lucide-react'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [city, setCity] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email o password non corretti')
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    if (!username.trim()) { setError('Inserisci un username'); setLoading(false); return }
    if (password.length < 6) { setError('Password min. 6 caratteri'); setLoading(false); return }

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }

    if (data.user) {
      await new Promise(r => setTimeout(r, 800))
      await supabase.from('profiles').upsert({
        id: data.user.id, username: username.trim(), city: city.trim()
      })
      setSuccess('Account creato! Ora aggiungi il tuo cane 🐾')
    }
    setLoading(false)
  }

  // Login rapido con account demo
  const quickLogin = async (em, pw) => {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: em, password: pw })
    if (error) setError('Account demo non disponibile')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
      style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FED7AA 50%, #FECACA 100%)' }}>

      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-0.5 mb-1">
          <span className="text-5xl font-black" style={{ color: '#F97316', fontFamily: 'Fredoka, sans-serif' }}>QU</span>
          <span className="text-5xl font-black" style={{ color: '#1E3A8A', fontFamily: 'Fredoka, sans-serif' }}>ilazampa</span>
          <span className="text-5xl font-black" style={{ color: '#F97316' }}>!</span>
        </div>
        <p className="text-sm font-semibold text-gray-700">La community intelligente delle aree cani</p>
        <p className="text-xs text-gray-500 italic mt-1">🐾 Dove i cani socializzano meglio</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-6">
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-5">
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === m ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
              {m === 'login' ? 'Accedi' : 'Registrati'}
            </button>
          ))}
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-3">
          {mode === 'register' && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Username" required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={city} onChange={e => setCity(e.target.value)}
                  placeholder="Città (es. Milano)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
              </div>
            </>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email" required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Password (min. 6 caratteri)" required
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
              {showPw ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
            </button>
          </div>

          {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>}
          {success && <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <p className="text-xs text-green-700">{success}</p>
          </div>}

          <button type="submit" disabled={loading}
            className="w-full text-white font-bold py-3.5 rounded-xl shadow-md active:scale-95 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            {loading ? '⏳ Attendere...' : mode === 'login' ? '🐾 Accedi' : '🚀 Crea account'}
          </button>
        </form>

        {/* Account demo */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center mb-2 font-semibold">ACCESSO RAPIDO DEMO</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => quickLogin('admin@quilazampa.it', 'admin123!')}
              className="py-2 px-3 rounded-xl text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }}>
              👑 Admin
            </button>
            <button onClick={() => quickLogin('marco@demo.it', 'demo123!')}
              className="py-2 px-3 rounded-xl text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
              🐕 Utente demo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
