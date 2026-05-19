'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Plus, Trash2, DollarSign } from 'lucide-react';
import { supabase } from './supabase';

export default function Page() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState('Josh');
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');

  const [amount, setAmount] = useState('');
  const [isWin, setIsWin] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [platform, setPlatform] = useState('PrizePicks');
  const [notes, setNotes] = useState('');

  const platforms = ['PrizePicks', 'DraftKings', 'FanDuel', 'Underdog', 'Sportsbook', 'Other'];

  useEffect(() => {
    loadEntries();

    // Live updates: when one of you adds, the other sees it instantly
    const channel = supabase
      .channel('entries-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, () => {
        loadEntries();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadEntries = async () => {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (!error && data) setEntries(data);
    setLoading(false);
  };

  const addEntry = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    const { error } = await supabase.from('entries').insert({
      user_name: activeUser,
      amount: parseFloat(amount),
      is_win: isWin,
      date,
      platform,
      notes: notes.trim() || null,
    });
    if (error) { alert('Save failed: ' + error.message); return; }
    setAmount(''); setNotes(''); setIsWin(true); setShowForm(false);
  };

  const deleteEntry = async (id) => {
    await supabase.from('entries').delete().eq('id', id);
  };

  const calcTotal = (user) => entries
    .filter(e => user === 'all' || e.user_name === user)
    .reduce((sum, e) => sum + (e.is_win ? Number(e.amount) : -Number(e.amount)), 0);

  const joshTotal = calcTotal('Josh');
  const brendanTotal = calcTotal('Brendan');
  const combinedTotal = joshTotal + brendanTotal;

  const filteredEntries = entries.filter(e => filter === 'all' || e.user_name.toLowerCase() === filter);
  const formatMoney = (n) => (n < 0 ? '-$' : '$') + Math.abs(n).toFixed(2);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', color: '#e8eaf0', fontFamily: '"Space Mono", "Courier New", monospace', padding: '20px 16px', paddingBottom: '120px' }}>
      <style>{`
        * { box-sizing: border-box; }
        .card { background: #131826; border: 1px solid #1f2738; border-radius: 12px; }
        .display-font { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.05em; }
        .glow-green { box-shadow: 0 0 24px rgba(74, 222, 128, 0.15); }
        .glow-red { box-shadow: 0 0 24px rgba(248, 113, 113, 0.15); }
        button { transition: all 0.15s ease; }
        button:active { transform: scale(0.97); }
        input, select, textarea { font-family: inherit; }
        input:focus, select:focus, textarea:focus { outline: 2px solid #4ade80; outline-offset: 1px; }
      `}</style>

      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <div className="display-font" style={{ fontSize: '38px', lineHeight: 1, color: '#4ade80', textShadow: '0 0 20px rgba(74, 222, 128, 0.3)' }}>SIDE QUESTS</div>
          <div style={{ fontSize: '11px', letterSpacing: '0.3em', color: '#6b7280', marginTop: '4px' }}>JOSH × BRENDAN — LIVE LEDGER</div>
        </div>

        <div className={`card ${combinedTotal >= 0 ? 'glow-green' : 'glow-red'}`} style={{ padding: '20px', marginBottom: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#6b7280', marginBottom: '6px' }}>COMBINED P/L</div>
          <div className="display-font" style={{ fontSize: '48px', color: combinedTotal >= 0 ? '#4ade80' : '#f87171' }}>{formatMoney(combinedTotal)}</div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          {[
            { name: 'Josh', total: joshTotal, count: entries.filter(e => e.user_name === 'Josh').length },
            { name: 'Brendan', total: brendanTotal, count: entries.filter(e => e.user_name === 'Brendan').length },
          ].map(p => (
            <div key={p.name} className="card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#6b7280' }}>{p.name.toUpperCase()}</div>
              <div className="display-font" style={{ fontSize: '28px', color: p.total >= 0 ? '#4ade80' : '#f87171', lineHeight: 1.1, marginTop: '4px' }}>{formatMoney(p.total)}</div>
              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>{p.count} entries</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
          {['all', 'josh', 'brendan'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ flex: 1, padding: '8px', background: filter === f ? '#4ade80' : 'transparent', color: filter === f ? '#0a0e1a' : '#9ca3af', border: `1px solid ${filter === f ? '#4ade80' : '#1f2738'}`, borderRadius: '8px', fontSize: '11px', letterSpacing: '0.15em', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase' }}>{f}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}>Loading...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>No entries yet. Tap + to log one.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredEntries.map(e => (
              <div key={e.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: e.is_win ? 'rgba(74, 222, 128, 0.12)' : 'rgba(248, 113, 113, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {e.is_win ? <TrendingUp size={18} color="#4ade80" /> : <TrendingDown size={18} color="#f87171" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span className="display-font" style={{ fontSize: '20px', color: e.is_win ? '#4ade80' : '#f87171' }}>{e.is_win ? '+' : '-'}${Number(e.amount).toFixed(2)}</span>
                    <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700 }}>{e.user_name}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span>{e.platform}</span><span>·</span>
                    <span>{new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    {e.notes && <><span>·</span><span style={{ fontStyle: 'italic' }}>{e.notes}</span></>}
                  </div>
                </div>
                <button onClick={() => deleteEntry(e.id)} style={{ background: 'transparent', border: 'none', color: '#4b5563', cursor: 'pointer', padding: '6px' }} aria-label="Delete"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {!showForm && (
        <button onClick={() => setShowForm(true)} style={{ position: 'fixed', bottom: '24px', right: '24px', width: '60px', height: '60px', borderRadius: '50%', background: '#4ade80', border: 'none', color: '#0a0e1a', cursor: 'pointer', boxShadow: '0 8px 24px rgba(74, 222, 128, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }} aria-label="Add entry"><Plus size={28} strokeWidth={2.5} /></button>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px' }} onClick={() => setShowForm(false)}>
          <div className="card" style={{ width: '100%', maxWidth: '460px', padding: '20px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="display-font" style={{ fontSize: '24px', color: '#4ade80', marginBottom: '16px' }}>NEW ENTRY</div>

            <label style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#6b7280', display: 'block', marginBottom: '6px' }}>WHO</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
              {['Josh', 'Brendan'].map(u => (
                <button key={u} onClick={() => setActiveUser(u)} style={{ padding: '10px', background: activeUser === u ? '#4ade80' : 'transparent', color: activeUser === u ? '#0a0e1a' : '#e8eaf0', border: `1px solid ${activeUser === u ? '#4ade80' : '#1f2738'}`, borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>{u}</button>
              ))}
            </div>

            <label style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#6b7280', display: 'block', marginBottom: '6px' }}>RESULT</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
              <button onClick={() => setIsWin(true)} style={{ padding: '10px', background: isWin ? '#4ade80' : 'transparent', color: isWin ? '#0a0e1a' : '#e8eaf0', border: `1px solid ${isWin ? '#4ade80' : '#1f2738'}`, borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>WON</button>
              <button onClick={() => setIsWin(false)} style={{ padding: '10px', background: !isWin ? '#f87171' : 'transparent', color: !isWin ? '#0a0e1a' : '#e8eaf0', border: `1px solid ${!isWin ? '#f87171' : '#1f2738'}`, borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>LOST</button>
            </div>

            <label style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#6b7280', display: 'block', marginBottom: '6px' }}>AMOUNT</label>
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <DollarSign size={16} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="number" inputMode="decimal" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '12px 12px 12px 34px', background: '#0a0e1a', border: '1px solid #1f2738', borderRadius: '8px', color: '#e8eaf0', fontSize: '16px' }} autoFocus />
            </div>

            <label style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#6b7280', display: 'block', marginBottom: '6px' }}>DATE</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '12px', background: '#0a0e1a', border: '1px solid #1f2738', borderRadius: '8px', color: '#e8eaf0', fontSize: '14px', marginBottom: '14px' }} />

            <label style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#6b7280', display: 'block', marginBottom: '6px' }}>PLATFORM</label>
            <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ width: '100%', padding: '12px', background: '#0a0e1a', border: '1px solid #1f2738', borderRadius: '8px', color: '#e8eaf0', fontSize: '14px', marginBottom: '14px' }}>
              {platforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <label style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#6b7280', display: 'block', marginBottom: '6px' }}>NOTES (OPTIONAL)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="3-leg parlay, NBA props..." rows={2} style={{ width: '100%', padding: '12px', background: '#0a0e1a', border: '1px solid #1f2738', borderRadius: '8px', color: '#e8eaf0', fontSize: '13px', marginBottom: '18px', resize: 'vertical' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '12px', background: 'transparent', color: '#9ca3af', border: '1px solid #1f2738', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>CANCEL</button>
              <button onClick={addEntry} disabled={!amount || parseFloat(amount) <= 0} style={{ padding: '12px', background: (!amount || parseFloat(amount) <= 0) ? '#1f2738' : '#4ade80', color: (!amount || parseFloat(amount) <= 0) ? '#6b7280' : '#0a0e1a', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: (!amount || parseFloat(amount) <= 0) ? 'not-allowed' : 'pointer' }}>LOG IT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
