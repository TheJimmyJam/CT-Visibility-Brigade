import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format, parseISO } from 'date-fns'

function AnnouncementCard({ ann }) {
  return (
    <div className={`card ann-card ${ann.pinned ? 'pinned' : ''}`} style={{marginBottom:12}}>
      {ann.pinned && <div className="pinned-bar">📌 Pinned</div>}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
        <h3 style={{fontSize:'1rem',color:'var(--text)'}}>{ann.title}</h3>
        <span className="text-xs text-muted" style={{whiteSpace:'nowrap',flexShrink:0}}>
          {format(parseISO(ann.created_at), 'MMM d')}
        </span>
      </div>
      <p style={{color:'var(--text-muted)',marginTop:8,fontSize:'0.9rem',textTransform:'none',fontFamily:'Lato',letterSpacing:0,fontWeight:400,lineHeight:1.6}}>
        {ann.body}
      </p>
      {ann.profiles && (
        <p style={{color:'var(--text-dim)',fontSize:'0.75rem',marginTop:8,textTransform:'none',fontFamily:'Lato',letterSpacing:0}}>
          — {ann.profiles.display_name || ann.profiles.full_name}
        </p>
      )}
    </div>
  )
}

function EventRow({ event }) {
  const d = parseISO(event.event_date + 'T00:00:00')
  const statusColor = {upcoming:'badge-green',active:'badge-yellow',completed:'badge-gray',cancelled:'badge-red'}
  return (
    <div style={{display:'flex',gap:16,alignItems:'flex-start',padding:'12px 0',borderBottom:'1px solid var(--border)'}}>
      <div style={{background:'var(--primary)',borderRadius:4,padding:'6px 10px',textAlign:'center',minWidth:52,flexShrink:0}}>
        <div style={{fontFamily:'Oswald',fontWeight:700,fontSize:'1.3rem',color:'#fff',lineHeight:1}}>{format(d,'d')}</div>
        <div style={{fontFamily:'Oswald',fontSize:'0.65rem',letterSpacing:'0.1em',color:'rgba(255,255,255,0.8)',textTransform:'uppercase'}}>{format(d,'MMM')}</div>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
          <h4 style={{fontSize:'0.95rem'}}>{event.title}</h4>
          <span className={`badge ${statusColor[event.status]}`}>{event.status}</span>
        </div>
        <p style={{color:'var(--text-muted)',fontSize:'0.8rem',marginTop:3,textTransform:'none',fontFamily:'Lato',letterSpacing:0}}>
          📍 {event.location_name}
          {event.event_time && ` · ${format(parseISO(`2000-01-01T${event.event_time}`),'h:mm a')}`}
        </p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [events, setEvents] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [annRes, evtRes, postsRes] = await Promise.all([
        supabase.from('announcements').select('*, profiles(display_name,full_name)').order('pinned', {ascending:false}).order('created_at', {ascending:false}).limit(5),
        supabase.from('events').select('*').gte('event_date', new Date().toISOString().split('T')[0]).order('event_date').limit(4),
        supabase.from('posts').select('*, profiles(display_name,full_name)').order('created_at', {ascending:false}).limit(3)
      ])
      setAnnouncements(annRes.data || [])
      setEvents(evtRes.data || [])
      setPosts(postsRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const displayName = profile?.display_name || profile?.full_name?.split(' ')[0] || 'Brigadier'

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="container">
        <div className="page-header" style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <h1 className="page-title">Welcome back, {displayName}</h1>
            <p className="page-subtitle">Here's what's happening with the CT Visibility Brigade.</p>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <Link to="/events" className="btn btn-outline btn-sm">All Events →</Link>
            <Link to="/board" className="btn btn-outline btn-sm">Community Board →</Link>
          </div>
        </div>

        <div className="grid-sidebar">
          {/* Main */}
          <div>
            {/* Announcements */}
            <div style={{marginBottom:28}}>
              <div className="section-label">📢 Announcements</div>
              {announcements.length === 0 ? (
                <div className="empty-state" style={{padding:'24px'}}>
                  <p>No announcements yet.</p>
                </div>
              ) : (
                announcements.map(a => <AnnouncementCard key={a.id} ann={a} />)
              )}
            </div>

            {/* Community Board preview */}
            <div>
              <div className="section-label" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span>💬 Community Board</span>
                <Link to="/board" style={{fontSize:'0.75rem',color:'var(--primary-light)',textTransform:'none',letterSpacing:0,fontFamily:'Lato',fontWeight:400}}>See all →</Link>
              </div>
              {posts.length === 0 ? (
                <div className="empty-state" style={{padding:'24px'}}>
                  <p>No posts yet. Be the first!</p>
                </div>
              ) : (
                posts.map(p => (
                  <div key={p.id} className="card" style={{marginBottom:10}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <div className="avatar avatar-sm">{(p.profiles?.display_name||'?').slice(0,2).toUpperCase()}</div>
                      <span style={{fontFamily:'Oswald',fontSize:'0.85rem'}}>{p.profiles?.display_name}</span>
                      <span className="text-xs text-muted">{format(parseISO(p.created_at),'MMM d')}</span>
                    </div>
                    <p style={{color:'var(--text-muted)',fontSize:'0.875rem',textTransform:'none',fontFamily:'Lato',letterSpacing:0,fontWeight:400,lineHeight:1.6}}>
                      {p.body.length > 200 ? p.body.slice(0,200)+'...' : p.body}
                    </p>
                  </div>
                ))
              )}
              <Link to="/board" className="btn btn-ghost btn-sm w-full" style={{justifyContent:'center',marginTop:8}}>Go to Community Board</Link>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="section-label">📅 Upcoming Actions</div>
            <div className="card" style={{padding:'16px 20px'}}>
              {events.length === 0 ? (
                <div style={{color:'var(--text-muted)',fontSize:'0.875rem',padding:'8px 0'}}>
                  No upcoming events. Check back soon!
                </div>
              ) : (
                events.map(e => <EventRow key={e.id} event={e} />)
              )}
              <Link to="/events" className="btn btn-outline btn-sm w-full" style={{marginTop:12,justifyContent:'center'}}>
                View Full Calendar + Map
              </Link>
            </div>

            {/* Quick links */}
            <div style={{marginTop:20}}>
              <div className="section-label">🔗 Quick Links</div>
              <div className="card" style={{padding:'12px 16px'}}>
                {[
                  {label:'Overpass Action Toolkit', url:'https://drive.google.com/file/d/13DXyvaHWtYu4XCxvJGVm83wPWaQSkHxD/view'},
                  {label:'National VB Website', url:'https://www.visibilitybrigade.com'},
                  {label:'Best Practices for Members', url:'https://drive.google.com/file/d/1OWA4nMZauoFW_UB9bavvgsnCj-la-Uyp/view'},
                ].map(l => (
                  <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                    style={{display:'block',padding:'8px 0',borderBottom:'1px solid var(--border)',color:'var(--text-muted)',fontSize:'0.85rem',fontFamily:'Lato',textTransform:'none',letterSpacing:0,transition:'color 0.15s'}}
                    onMouseEnter={e=>e.target.style.color='var(--text)'}
                    onMouseLeave={e=>e.target.style.color='var(--text-muted)'}
                  >
                    {l.label} ↗
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
