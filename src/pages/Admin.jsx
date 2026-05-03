import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format, parseISO } from 'date-fns'

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY
const FROM_EMAIL = import.meta.env.VITE_FROM_EMAIL || 'updates@ctvisibilitybrigade.com'

// ---- Announcements Tab ----
function AnnouncementsTab({ user }) {
  const [list, setList] = useState([])
  const [form, setForm] = useState({ title: '', body: '', pinned: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [editId, setEditId] = useState(null)

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('announcements').select('*').order('pinned',{ascending:false}).order('created_at',{ascending:false})
    setList(data || [])
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true); setError(null)
    if (editId) {
      const { error } = await supabase.from('announcements').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editId)
      if (error) setError(error.message)
      else { setEditId(null); setForm({ title:'', body:'', pinned:false }); load() }
    } else {
      const { error } = await supabase.from('announcements').insert({ ...form, author_id: user.id })
      if (error) setError(error.message)
      else { setForm({ title:'', body:'', pinned:false }); load() }
    }
    setSaving(false)
  }

  function startEdit(a) {
    setEditId(a.id)
    setForm({ title: a.title, body: a.body, pinned: a.pinned })
  }

  async function del(id) {
    if (!confirm('Delete this announcement?')) return
    await supabase.from('announcements').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="card" style={{marginBottom:24}}>
        <div className="card-header">
          <h3 style={{fontSize:'1rem'}}>{editId ? 'Edit Announcement' : 'New Announcement'}</h3>
        </div>
        {error && <div className="alert alert-error mb-2">{error}</div>}
        <form onSubmit={save} style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea className="form-textarea" value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))} required style={{minHeight:120}} />
          </div>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontFamily:'Oswald',fontSize:'0.8rem',textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-muted)'}}>
            <input type="checkbox" checked={form.pinned} onChange={e=>setForm(f=>({...f,pinned:e.target.checked}))} />
            Pin to top of dashboard
          </label>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving?'Saving...':editId?'Update':'Post Announcement'}</button>
            {editId && <button type="button" className="btn btn-outline" onClick={()=>{setEditId(null);setForm({title:'',body:'',pinned:false})}}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="section-label">Posted Announcements</div>
      {list.length === 0 ? <p style={{color:'var(--text-muted)',fontSize:'0.875rem'}}>None yet.</p> : list.map(a => (
        <div key={a.id} className={`card ann-card ${a.pinned?'pinned':''}`} style={{marginBottom:10}}>
          {a.pinned && <div className="pinned-bar">📌 Pinned</div>}
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
            <div style={{flex:1}}>
              <h4 style={{fontSize:'0.95rem',marginBottom:4}}>{a.title}</h4>
              <p style={{color:'var(--text-muted)',fontSize:'0.875rem',textTransform:'none',fontFamily:'Lato',letterSpacing:0,fontWeight:400}}>{a.body}</p>
              <p style={{color:'var(--text-dim)',fontSize:'0.75rem',marginTop:6}}>{format(parseISO(a.created_at),'MMM d, yyyy')}</p>
            </div>
            <div style={{display:'flex',gap:6,flexShrink:0}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>startEdit(a)}>✏️</button>
              <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={()=>del(a.id)}>🗑</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---- Events Tab ----
function EventsTab({ user }) {
  const [list, setList] = useState([])
  const [form, setForm] = useState({ title:'', description:'', event_date:'', event_time:'', end_time:'', location_name:'', address:'', lat:'', lng:'', bridge_name:'', status:'upcoming' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [editId, setEditId] = useState(null)

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('events').select('*').order('event_date',{ascending:false})
    setList(data || [])
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true); setError(null)
    const payload = {
      ...form,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      event_time: form.event_time || null,
      end_time: form.end_time || null,
    }
    if (editId) {
      const { error } = await supabase.from('events').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editId)
      if (error) setError(error.message)
      else { setEditId(null); resetForm(); load() }
    } else {
      const { error } = await supabase.from('events').insert({ ...payload, created_by: user.id })
      if (error) setError(error.message)
      else { resetForm(); load() }
    }
    setSaving(false)
  }

  function resetForm() {
    setForm({ title:'', description:'', event_date:'', event_time:'', end_time:'', location_name:'', address:'', lat:'', lng:'', bridge_name:'', status:'upcoming' })
  }

  function startEdit(e) {
    setEditId(e.id)
    setForm({ title:e.title||'', description:e.description||'', event_date:e.event_date||'', event_time:e.event_time||'', end_time:e.end_time||'', location_name:e.location_name||'', address:e.address||'', lat:e.lat||'', lng:e.lng||'', bridge_name:e.bridge_name||'', status:e.status||'upcoming' })
  }

  async function del(id) {
    if (!confirm('Delete this event?')) return
    await supabase.from('events').delete().eq('id', id)
    load()
  }

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div>
      <div className="card" style={{marginBottom:24}}>
        <div className="card-header">
          <h3 style={{fontSize:'1rem'}}>{editId ? 'Edit Event' : 'New Event / Action'}</h3>
        </div>
        {error && <div className="alert alert-error mb-2">{error}</div>}
        <form onSubmit={save} style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Event Title *</label>
              <input className="form-input" value={form.title} onChange={set('title')} required placeholder="e.g. I-95 Rush Hour Action" />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={set('status')}>
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input className="form-input" type="date" value={form.event_date} onChange={set('event_date')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input className="form-input" type="time" value={form.event_time} onChange={set('event_time')} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input className="form-input" type="time" value={form.end_time} onChange={set('end_time')} />
            </div>
            <div className="form-group">
              <label className="form-label">Location Name *</label>
              <input className="form-input" value={form.location_name} onChange={set('location_name')} required placeholder="e.g. Westport, CT" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bridge / Overpass Name</label>
            <input className="form-input" value={form.bridge_name} onChange={set('bridge_name')} placeholder="e.g. I-95 Exit 17 Overpass" />
          </div>

          <div className="form-group">
            <label className="form-label">Full Address</label>
            <input className="form-input" value={form.address} onChange={set('address')} placeholder="For Google Maps link" />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Latitude (for map pin)</label>
              <input className="form-input" type="number" step="any" value={form.lat} onChange={set('lat')} placeholder="41.0534" />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude (for map pin)</label>
              <input className="form-input" type="number" step="any" value={form.lng} onChange={set('lng')} placeholder="-73.5387" />
            </div>
          </div>
          <p className="form-hint">Tip: Right-click any location on Google Maps → "What's here?" to get coordinates.</p>

          <div className="form-group">
            <label className="form-label">Notes / Description</label>
            <textarea className="form-textarea" value={form.description} onChange={set('description')} placeholder="Parking info, what to bring, sign themes..." style={{minHeight:80}} />
          </div>

          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving?'Saving...':editId?'Update Event':'Create Event'}</button>
            {editId && <button type="button" className="btn btn-outline" onClick={()=>{setEditId(null);resetForm()}}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="section-label">All Events</div>
      {list.length === 0 ? <p style={{color:'var(--text-muted)',fontSize:'0.875rem'}}>None yet.</p> : list.map(e => (
        <div key={e.id} className="card" style={{marginBottom:10}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <h4 style={{fontSize:'0.95rem'}}>{e.title}</h4>
                <span className="tag">{e.status}</span>
                <span className="text-xs text-muted">{e.event_date}</span>
              </div>
              <p style={{color:'var(--text-muted)',fontSize:'0.8rem',marginTop:3,textTransform:'none',fontFamily:'Lato',letterSpacing:0}}>{e.location_name}</p>
            </div>
            <div style={{display:'flex',gap:6,flexShrink:0}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>startEdit(e)}>✏️</button>
              <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={()=>del(e.id)}>🗑</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---- Newsletter Tab ----
function NewsletterTab() {
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ subject: '', body: '' })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('subscribers').select('*').eq('active', true).order('subscribed_at', {ascending:false})
    setSubscribers(data || [])
    setLoading(false)
  }

  async function sendNewsletter(e) {
    e.preventDefault()
    if (!confirm(`Send to ${subscribers.length} subscribers?`)) return
    setSending(true); setResult(null)

    try {
      const emails = subscribers.map(s => s.email)
      // Send in batches of 50 using BCC
      const batchSize = 50
      let sent = 0
      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize)
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `CT Visibility Brigade <${FROM_EMAIL}>`,
            to: [FROM_EMAIL],
            bcc: batch,
            subject: form.subject,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#13181d;color:#e8e8e8;padding:32px;border-radius:8px;">
              <h1 style="font-family:Georgia,serif;color:#e74c3c;text-transform:uppercase;letter-spacing:2px;font-size:1.8rem;margin:0 0 4px 0;">CT Visibility Brigade</h1>
              <p style="color:#8fa0b0;font-size:0.8rem;text-transform:uppercase;letter-spacing:2px;margin:0 0 24px 0;">Rush Hour Resistance</p>
              <hr style="border:none;border-top:1px solid #2a3a4a;margin:0 0 24px 0;"/>
              <h2 style="color:#e8e8e8;font-size:1.3rem;margin:0 0 16px 0;">${form.subject}</h2>
              <div style="color:#d0d0d0;font-size:0.95rem;line-height:1.7;">${form.body.replace(/\n/g, '<br/>')}</div>
              <hr style="border:none;border-top:1px solid #2a3a4a;margin:24px 0;"/>
              <p style="color:#5a6a7a;font-size:0.75rem;">You're receiving this because you signed up for CT Visibility Brigade updates. Reply to unsubscribe.</p>
            </div>`,
          }),
        })
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        sent += batch.length
      }
      setResult({ type: 'success', msg: `Sent to ${sent} subscribers!` })
      setForm({ subject: '', body: '' })
    } catch (err) {
      setResult({ type: 'error', msg: err.message })
    }
    setSending(false)
  }

  async function exportCSV() {
    const rows = [['Email', 'Name', 'ZIP', 'Subscribed At'], ...subscribers.map(s => [s.email, s.full_name||'', s.zip_code||'', s.subscribed_at])]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'subscribers.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid-3" style={{marginBottom:24}}>
        {[
          { n: loading ? '...' : subscribers.length, l: 'Active Subscribers' },
          { n: loading ? '...' : subscribers.filter(s => s.zip_code).length, l: 'With ZIP Code' },
          { n: loading ? '...' : new Set(subscribers.map(s=>s.zip_code).filter(Boolean)).size, l: 'Unique ZIPs' },
        ].map(s => (
          <div key={s.l} className="card" style={{textAlign:'center'}}>
            <div style={{fontFamily:'Oswald',fontWeight:700,fontSize:'2rem',color:'var(--primary-light)'}}>{s.n}</div>
            <div style={{fontFamily:'Oswald',fontSize:'0.7rem',letterSpacing:'0.1em',color:'var(--text-muted)',textTransform:'uppercase'}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Send newsletter */}
      <div className="card" style={{marginBottom:24}}>
        <div className="card-header">
          <h3 style={{fontSize:'1rem'}}>Send Newsletter</h3>
        </div>
        {result && <div className={`alert alert-${result.type === 'success' ? 'success' : 'error'} mb-2`}>{result.msg}</div>}
        <form onSubmit={sendNewsletter} style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="form-group">
            <label className="form-label">Subject Line</label>
            <input className="form-input" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} required placeholder="e.g. Action Alert: This Saturday at 8am!" />
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea className="form-textarea" value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))} required style={{minHeight:160}} placeholder="Write your email body here. Plain text works fine." />
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <button className="btn btn-primary" type="submit" disabled={sending || subscribers.length === 0}>
              {sending ? 'Sending...' : `Send to ${subscribers.length} subscribers`}
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={exportCSV} disabled={subscribers.length===0}>
              Export CSV
            </button>
          </div>
        </form>
      </div>

      {/* Subscriber list */}
      <div className="section-label">Recent Subscribers</div>
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        {loading ? (
          <div style={{padding:24,textAlign:'center'}}><div className="spinner" style={{margin:'0 auto'}} /></div>
        ) : subscribers.length === 0 ? (
          <div style={{padding:24,textAlign:'center',color:'var(--text-muted)',fontSize:'0.875rem'}}>No subscribers yet.</div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'1px solid var(--border)'}}>
                {['Email','Name','ZIP','Joined'].map(h => (
                  <th key={h} style={{padding:'10px 16px',textAlign:'left',fontFamily:'Oswald',fontSize:'0.75rem',letterSpacing:'0.08em',color:'var(--text-muted)',textTransform:'uppercase',fontWeight:500}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subscribers.slice(0, 50).map(s => (
                <tr key={s.id} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                  <td style={{padding:'10px 16px',fontSize:'0.85rem'}}>{s.email}</td>
                  <td style={{padding:'10px 16px',fontSize:'0.85rem',color:'var(--text-muted)'}}>{s.full_name||'—'}</td>
                  <td style={{padding:'10px 16px',fontSize:'0.85rem',color:'var(--text-muted)'}}>{s.zip_code||'—'}</td>
                  <td style={{padding:'10px 16px',fontSize:'0.8rem',color:'var(--text-dim)'}}>{format(parseISO(s.subscribed_at),'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ---- Members Tab ----
function MembersTab() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('joined_at', {ascending:false})
    setMembers(data || [])
    setLoading(false)
  }

  async function setRole(id, role) {
    await supabase.from('profiles').update({ role }).eq('id', id)
    setMembers(m => m.map(x => x.id === id ? {...x, role} : x))
  }

  return (
    <div>
      <div style={{marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <p style={{color:'var(--text-muted)',fontSize:'0.875rem',textTransform:'none',fontFamily:'Lato',letterSpacing:0}}>
          {members.length} registered member{members.length!==1?'s':''}
        </p>
      </div>

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        {loading ? (
          <div style={{padding:24,textAlign:'center'}}><div className="spinner" style={{margin:'0 auto'}} /></div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'1px solid var(--border)'}}>
                {['Name','Email','Role','Joined','Actions'].map(h => (
                  <th key={h} style={{padding:'10px 16px',textAlign:'left',fontFamily:'Oswald',fontSize:'0.75rem',letterSpacing:'0.08em',color:'var(--text-muted)',textTransform:'uppercase',fontWeight:500}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                  <td style={{padding:'10px 16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div className="avatar avatar-sm">{(m.display_name||m.full_name||m.email||'?').slice(0,2).toUpperCase()}</div>
                      <span style={{fontSize:'0.875rem'}}>{m.display_name || m.full_name || '—'}</span>
                    </div>
                  </td>
                  <td style={{padding:'10px 16px',fontSize:'0.8rem',color:'var(--text-muted)'}}>{m.email}</td>
                  <td style={{padding:'10px 16px'}}>
                    <span className={`badge ${m.role==='admin'?'badge-admin':'badge-gray'}`}>{m.role}</span>
                  </td>
                  <td style={{padding:'10px 16px',fontSize:'0.8rem',color:'var(--text-dim)'}}>{m.joined_at ? format(parseISO(m.joined_at),'MMM d, yyyy') : '—'}</td>
                  <td style={{padding:'10px 16px'}}>
                    {m.role === 'admin'
                      ? <button className="btn btn-ghost btn-sm" onClick={()=>setRole(m.id,'member')}>→ Member</button>
                      : <button className="btn btn-ghost btn-sm" style={{color:'var(--primary-light)'}} onClick={()=>setRole(m.id,'admin')}>→ Admin</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ---- Main Admin Page ----
export default function Admin() {
  const { user } = useAuth()
  const [tab, setTab] = useState('announcements')

  const tabs = [
    { id: 'announcements', label: '📢 Announcements' },
    { id: 'events', label: '📅 Events' },
    { id: 'newsletter', label: '📧 Newsletter' },
    { id: 'members', label: '👥 Members' },
  ]

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">Manage announcements, events, newsletters, and members.</p>
        </div>

        <div className="tab-bar">
          {tabs.map(t => (
            <button key={t.id} className={`tab-btn ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {tab === 'announcements' && <AnnouncementsTab user={user} />}
        {tab === 'events' && <EventsTab user={user} />}
        {tab === 'newsletter' && <NewsletterTab />}
        {tab === 'members' && <MembersTab />}
      </div>
    </div>
  )
}
