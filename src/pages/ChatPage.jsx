import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { ChevronLeft, Send, Search, PawPrint, Sparkles } from 'lucide-react'

export default function ChatPage({ initialReceiverId = null }) {
  const { user } = useAuth()
  const [convs, setConvs] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchConvs()
    if (initialReceiverId) openConv(initialReceiverId)
  }, [user])

  useEffect(() => {
    if (!selected) return
    fetchMessages(selected.other_id)
    const ch = supabase.channel(`chat-${[user.id, selected.other_id].sort().join('-')}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new
        if ((m.sender_id === user.id && m.receiver_id === selected.other_id) ||
            (m.sender_id === selected.other_id && m.receiver_id === user.id)) {
          setMessages(prev => [...prev, m])
        }
      }).subscribe()
    return () => supabase.removeChannel(ch)
  }, [selected])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const fetchConvs = async () => {
    if (!user) return
    const { data } = await supabase.from('messages').select('sender_id,receiver_id,content,created_at')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: false })
    const map = {}
    data?.forEach(m => {
      const oid = m.sender_id === user.id ? m.receiver_id : m.sender_id
      if (!map[oid]) map[oid] = { other_id: oid, lastMsg: m.content, lastTime: m.created_at }
    })
    const ids = Object.keys(map)
    if (ids.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id,username,city').in('id', ids)
      profiles?.forEach(p => { if (map[p.id]) map[p.id].profile = p })
    }
    setConvs(Object.values(map))
  }

  const openConv = async (otherId) => {
    const { data: profile } = await supabase.from('profiles').select('id,username,city').eq('id', otherId).single()
    setSelected({ other_id: otherId, profile })
  }

  const fetchMessages = async (otherId) => {
    const { data } = await supabase.from('messages').select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
      .order('created_at')
    setMessages(data || [])
    await supabase.from('messages').update({ read: true }).eq('sender_id', otherId).eq('receiver_id', user.id).eq('read', false)
  }

  const sendMsg = async () => {
    if (!text.trim() || !selected) return
    setSending(true)
    const t = text.trim(); setText('')
    const { data } = await supabase.from('messages').insert({ sender_id: user.id, receiver_id: selected.other_id, content: t }).select().single()
    if (data) setMessages(prev => [...prev, data])
    setSending(false)
    fetchConvs()
  }

  const fmt = (ts) => new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

  if (selected) return (
    <div className="flex flex-col h-full">
      <div className="bg-white px-4 pt-3 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => setSelected(null)}><ChevronLeft className="w-6 h-6 text-gray-700" /></button>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ background: 'linear-gradient(135deg, #FED7AA, #FB923C)' }}>👤</div>
        <div>
          <h2 className="font-bold text-sm text-gray-900">{selected.profile?.username || 'Utente'}</h2>
          <p className="text-[10px] text-gray-500">{selected.profile?.city || ''}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2"
        style={{ background: 'linear-gradient(180deg, #FEF3C7, #FED7AA)' }}>
        {messages.length === 0 && (
          <div className="text-center py-8">
            <PawPrint className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">Inizia la conversazione!</p>
          </div>
        )}
        {messages.map((m, i) => {
          const isMe = m.sender_id === user.id
          return (
            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl shadow-sm ${isMe ? 'rounded-br-sm text-white' : 'bg-white text-gray-800 rounded-bl-sm'}`}
                style={isMe ? { background: 'linear-gradient(135deg, #F97316, #EA580C)' } : {}}>
                <p className="text-sm">{m.content}</p>
                <p className={`text-[9px] mt-0.5 text-right ${isMe ? 'text-orange-100' : 'text-gray-400'}`}>{fmt(m.created_at)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <div className="bg-white px-3 py-2 border-t border-gray-100 flex items-center gap-2">
        <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2.5">
          <input type="text" value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMsg()}
            placeholder="Scrivi un messaggio..." className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <button onClick={sendMsg} disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100">
        <h2 className="font-bold text-gray-900 text-base text-center">Chat</h2>
      </div>
      <div className="bg-white px-4 pb-3 pt-2 border-b border-gray-100">
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input type="text" placeholder="Cerca conversazioni..." className="flex-1 bg-transparent text-sm outline-none" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {convs.length === 0 && (
          <div className="text-center py-12 px-6">
            <div className="text-5xl mb-3">💬</div>
            <p className="font-semibold text-gray-700">Nessuna conversazione</p>
            <p className="text-xs text-gray-500 mt-1">Vai in un'area cani e tocca 💬 su un cane per iniziare!</p>
          </div>
        )}
        {convs.map((conv, i) => (
          <button key={i} onClick={() => setSelected(conv)}
            className="w-full bg-white flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 text-left">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #FED7AA, #FB923C)' }}>👤</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900">{conv.profile?.username || 'Utente'}</h3>
                <span className="text-[10px] text-gray-400">{fmt(conv.lastTime)}</span>
              </div>
              <p className="text-xs text-gray-600 truncate mt-0.5">{conv.lastMsg}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
