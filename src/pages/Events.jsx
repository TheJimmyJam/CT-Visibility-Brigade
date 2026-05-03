import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import { format, parseISO, isPast, isToday } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'

// Fix leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
})

const statusBadge = {upcoming:'badge-green',active:'badge-yellow',completed:'badge-gray',cancelled:'badge-red'}

export default function Events() {
  const { isAdmin } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list') // list | map
  const [filter, setFilter] = useState('upcoming')
  const [selected, setSelected] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('events').select('*').order('event_date')
    setEvents(data || [])
    setLoading(false)
  }

  const today = new Date().toISOString().split('T')[0]
  const filtered = events.filter(e => {
    if (filter === 'upcoming') return e.event_date >= today && e.status !== 'cancelled'
    if (filter === 'past') return e.event_date < today
    if (filter === 'all') return true
    return true
  })

  const mapEvents = events.filter(e => e.lat && e.lng)
  const ctCenter = [41.6032, -73.0877]

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="container">
        <div className="page-header" style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <h1 className="page-title">Events & Actions</h1>
            <p className="page-subtitle">Upcoming overpass actions across Connecticut.</p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className={`btn btn-sm ${view==='list'?'btn-primary':'btn-outline'}`} onClick={()=>setView('list')}>📋 List</button>
            <button className={`btn btn-sm ${view==='map'?'btn-primary':'btn-outline'}`} onClick={()=>setView('map')}>🗺️ Map</button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="tab-bar" style={{marginBottom:20}}>
          {['upcoming','past','all'].map(f => (
            <button key={f} className={`tab-btn ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>

        {view === 'map' ? (
          <div>
            <div className="map-container" style={{height:480}}>
              <MapContainer center={ctCenter} zoom={9} style={{height:'100%',width:'100%'}}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
                {mapEvents.map(e => (
                  <Marker key={e.id} position={[e.lat, e.lng]} icon={redIcon}>
                    <Popup>
                      <div style={{fontFamily:'sans-serif',minWidth:180}}>
                        <strong style={{display:'block',marginBottom:4}}>{e.title}</strong>
                        <span style={{fontSize:'0.8rem',color:'#666'}}>{e.location_name}</span><br/>
                        <span style={{fontSize:'0.8rem',color:'#666'}}>{format(parseISO(e.event_date+'T00:00:00'),'EEE, MMM d')}</span>
                        {e.event_time && <><br/><span style={{fontSize:'0.8rem',color:'#666'}}>{format(parseISO(`2000-01-01T${e.event_time}`),'h:mm a')}</span></>}
                        {e.description && <p style={{marginTop:6,fontSize:'0.8rem'}}>{e.description}</p>}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            {mapEvents.length === 0 && (
              <p style={{color:'var(--text-muted)',textAlign:'center',marginTop:12,fontSize:'0.875rem',textTransform:'none',fontFamily:'Lato',letterSpacing:0}}>
                No events with map coordinates yet. Admins can add lat/lng when creating events.
              </p>
            )}
          </div>
        ) : (
          <div>
            {filtered.length === 0 ? (
              <div className="empty-state">
                <h3>No events found</h3>
                <p>{filter === 'upcoming' ? 'Check back soon for upcoming actions.' : 'Nothing here yet.'}</p>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {filtered.map(event => {
                  const d = parseISO(event.event_date + 'T00:00:00')
                  const today_ = isToday(d)
                  return (
                    <div key={event.id} className={`card event-card ${today_?'ann-card':''}`} style={{cursor:'pointer',transition:'border-color 0.15s'}}
                      onClick={() => setSelected(selected?.id === event.id ? null : event)}>
                      <div style={{display:'flex',gap:16,alignItems:'flex-start'}}>
                        <div style={{background:'var(--primary)',borderRadius:4,padding:'8px 12px',textAlign:'center',flexShrink:0,minWidth:58}}>
                          <div style={{fontFamily:'Oswald',fontWeight:700,fontSize:'1.5rem',color:'#fff',lineHeight:1}}>{format(d,'d')}</div>
                          <div style={{fontFamily:'Oswald',fontSize:'0.65rem',letterSpacing:'0.1em',color:'rgba(255,255,255,0.8)',textTransform:'uppercase'}}>{format(d,'MMM')}</div>
                          <div style={{fontFamily:'Oswald',fontSize:'0.6rem',color:'rgba(255,255,255,0.6)',textTransform:'uppercase'}}>{format(d,'yyyy')}</div>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4}}>
                            <h3 style={{fontSize:'1.05rem'}}>{event.title}</h3>
                            {today_ && <span className="badge badge-yellow">Today!</span>}
                            <span className={`badge ${statusBadge[event.status]}`}>{event.status}</span>
                          </div>
                          <p style={{color:'var(--text-muted)',fontSize:'0.875rem',textTransform:'none',fontFamily:'Lato',letterSpacing:0,fontWeight:400}}>
                            📍 {event.location_name}
                            {event.bridge_name && ` (${event.bridge_name})`}
                          </p>
                          {event.event_time && (
                            <p style={{color:'var(--text-muted)',fontSize:'0.8rem',marginTop:3,textTransform:'none',fontFamily:'Lato',letterSpacing:0}}>
                              🕐 {format(parseISO(`2000-01-01T${event.event_time}`),'h:mm a')}
                              {event.end_time && ` – ${format(parseISO(`2000-01-01T${event.end_time}`),'h:mm a')}`}
                            </p>
                          )}
                          {event.address && <p style={{color:'var(--text-dim)',fontSize:'0.78rem',marginTop:3,textTransform:'none',fontFamily:'Lato',letterSpacing:0}}>📌 {event.address}</p>}
                        </div>
                      </div>

                      {selected?.id === event.id && event.description && (
                        <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid var(--border)'}}>
                          <p style={{color:'var(--text-muted)',fontSize:'0.9rem',textTransform:'none',fontFamily:'Lato',letterSpacing:0,fontWeight:400,lineHeight:1.7}}>
                            {event.description}
                          </p>
                          {event.lat && event.lng && (
                            <a href={`https://maps.google.com/?q=${event.lat},${event.lng}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline" style={{marginTop:10}}>
                              Open in Google Maps ↗
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {isAdmin && (
          <div style={{marginTop:24,textAlign:'center'}}>
            <p style={{color:'var(--text-muted)',fontSize:'0.875rem',textTransform:'none',fontFamily:'Lato',letterSpacing:0}}>
              Admin: Create and manage events from the{' '}
              <a href="/admin" style={{color:'var(--primary-light)'}}>Admin Panel</a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
