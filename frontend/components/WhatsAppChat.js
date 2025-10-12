"use client";
import React, { useState, useRef, useEffect } from 'react';

export default function WhatsAppChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (open && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, open]);

  const toggle = () => setOpen(o => !o);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now()+"-u", role: 'user', text: input };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text }),
      });
      const j = await res.json();
      const botMsg = { id: Date.now()+"-b", role: 'bot', text: j.reply || 'Sorry, no reply' };
      setMessages(m => [...m, botMsg]);
    } catch (err) {
      console.error('Chat send failed', err);
      const botMsg = { id: Date.now()+"-b", role: 'bot', text: 'Failed to get reply. Please try again later.' };
      setMessages(m => [...m, botMsg]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 2000 }}>
      {open && (
        <div style={{ width: 320, height: 420, background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#25D366', color: '#fff', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: 36, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25D366', fontWeight: 700 }}>Y</div>
              <div>
                <div style={{ fontWeight: 700 }}>Yaritu Assistant</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>Hi! Ask me anything</div>
              </div>
            </div>
            <button onClick={toggle} aria-label="Close chat" style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20 }}>✕</button>
          </div>

          <div ref={containerRef} style={{ flex: 1, padding: 12, overflowY: 'auto', background: '#f6f6f6' }}>
            {messages.map(m => (
              <div key={m.id} style={{ marginBottom: 10, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ background: m.role === 'user' ? '#25384d' : '#fff', color: m.role === 'user' ? '#fff' : '#111', padding: '8px 12px', borderRadius: 8, maxWidth: '78%' }}>{m.text}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: 10, borderTop: '1px solid #eee', display: 'flex', gap: 8 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }} placeholder="Type a message" style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd' }} />
            <button onClick={sendMessage} disabled={sending} style={{ background: '#25384d', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Send</button>
          </div>
        </div>
      )}
      <button onClick={toggle} aria-label="Open chat" style={{ width: 56, height: 56, borderRadius: 28, background: '#25D366', border: 'none', boxShadow: '0 6px 18px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/images/logos_whatsapp-icon.png" alt="WhatsApp" style={{ width: 28, height: 28 }} />
      </button>
    </div>
  );
}
