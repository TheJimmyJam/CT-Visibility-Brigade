import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Landing() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [zip, setZip] = useState('')
  const [subStatus, setSubStatus] = useState(null)
  const [subLoading, setSubLoading] = useState(false)

  async function handleSubscribe(e) {
    e.preventDefault()
    if (!email) return
    setSubLoading(true)
    setSubStatus(null)
    try {
      const { error } = await supabase.from('subscribers').insert({ email, full_name: name, zip_code: zip })
      if (error) {
        if (error.code === '23505') setSubStatus({ type: 'info', msg: "You're already on the list! We'll be in touch." })
        else throw error
      } else {
        setSubStatus({ type: 'success', msg: "You're on the list! Welcome to the Visibility Brigade." })
        setEmail(''); setName(''); setZip('')
      }
    } catch {
      setSubStatus({ type: 'error', msg: 'Something went wrong. Try again.' })
    } finally {
      setSubLoading(false)
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <p style={{fontFamily:'Oswald',fontSize:'0.8rem',letterSpacing:'0.2em',color:'var(--primary-light)',marginBottom:12}}>
            ★ CONNECTICUT CHAPTER ★
          </p>
          <h1>RUSH HOUR<br/><span>RESISTANCE</span></h1>
          <p>
            The CT Visibility Brigade stands on overpasses every week with bold messages.
            Join us — we need you visible.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">Join the Brigade</Link>
            <Link to="/login" className="btn btn-outline btn-lg">Member Sign In</Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div style={{background:'var(--primary)',padding:'16px 0'}}>
        <div className="container">
          <div style={{display:'flex',gap:32,justifyContent:'center',flexWrap:'wrap'}}>
            {[
              {n:'Every Week', l:'Overpass Actions'},
              {n:'Connecticut', l:'Statewide Coverage'},
              {n:'Join Free', l:'Open to All'},
            ].map(s => (
              <div key={s.l} style={{textAlign:'center'}}>
                <div style={{fontFamily:'Oswald',fontWeight:700,fontSize:'1.4rem',color:'#fff'}}>{s.n}</div>
                <div style={{fontFamily:'Oswald',fontSize:'0.7rem',letterSpacing:'0.1em',color:'rgba(255,255,255,0.75)',textTransform:'uppercase'}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* About */}
      <section style={{padding:'64px 0', borderBottom:'1px solid var(--border)'}}>
        <div className="container">
          <div style={{maxWidth:700,margin:'0 auto',textAlign:'center'}}>
            <h2 style={{fontSize:'1.8rem',marginBottom:20}}>About CT Visibility Brigade</h2>
            <p style={{color:'var(--text-muted)',fontSize:'1.05rem',marginBottom:16,textTransform:'none',fontFamily:'Lato',letterSpacing:0,fontWeight:400,lineHeight:1.7}}>
              We stand on Connecticut's overpasses and bridges during rush hour with messages that
              remind commuters they are not alone. Inspired by the national Visibility Brigade movement,
              we organize weekly actions, coordinate messaging, and build community around nonviolent
              pro-democracy resistance.
            </p>
            <p style={{color:'var(--text-muted)',fontSize:'1.05rem',textTransform:'none',fontFamily:'Lato',letterSpacing:0,fontWeight:400,lineHeight:1.7}}>
              Harvard research shows that when 3.5% of people actively resist, meaningful change
              follows. Join us — every person visible on a bridge counts.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{padding:'64px 0',borderBottom:'1px solid var(--border)'}}>
        <div className="container">
          <h2 style={{textAlign:'center',marginBottom:36,fontSize:'1.6rem'}}>What You Get as a Member</h2>
          <div className="grid-3">
            {[
              { icon: '📢', title: 'Announcements', desc: 'Direct updates from Katherine and the leadership team — no noise, just what matters.' },
              { icon: '📅', title: 'Event Calendar', desc: 'See every upcoming action, which bridge, what time. RSVP and know your crew.' },
              { icon: '🗺️', title: 'Bridge Locations', desc: 'Interactive map of all our CT overpass locations so you can find ones near you.' },
              { icon: '💬', title: 'Community Board', desc: 'Coordinate with fellow members, share sign ideas, post photos, ask questions.' },
              { icon: '📧', title: 'Email Updates', desc: 'Get notified before big actions and democracy events. Unsubscribe anytime.' },
              { icon: '✊', title: 'One Place', desc: 'No more juggling three different apps. Everything in one hub, just for us.' },
            ].map(f => (
              <div key={f.title} className="card" style={{textAlign:'center'}}>
                <div style={{fontSize:'2rem',marginBottom:12}}>{f.icon}</div>
                <h3 style={{fontSize:'1rem',marginBottom:8}}>{f.title}</h3>
                <p style={{color:'var(--text-muted)',fontSize:'0.875rem',textTransform:'none',fontFamily:'Lato',letterSpacing:0,fontWeight:400,lineHeight:1.6}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mailing list */}
      <section id="subscribe" style={{padding:'64px 0',background:'var(--bg2)'}}>
        <div className="container">
          <div style={{maxWidth:500,margin:'0 auto',textAlign:'center'}}>
            <h2 style={{fontSize:'1.6rem',marginBottom:8}}>Stay in the Loop</h2>
            <p style={{color:'var(--text-muted)',marginBottom:24,textTransform:'none',fontFamily:'Lato',letterSpacing:0,fontWeight:400}}>
              Not ready to create an account? Get email updates on upcoming actions and events.
            </p>

            {subStatus && (
              <div className={`alert alert-${subStatus.type === 'success' ? 'success' : subStatus.type === 'info' ? 'info' : 'error'}`} style={{marginBottom:16,textAlign:'left'}}>
                {subStatus.msg}
              </div>
            )}

            <form onSubmit={handleSubscribe} style={{display:'flex',flexDirection:'column',gap:12}}>
              <input className="form-input" type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
              <input className="form-input" type="email" placeholder="Email address *" value={email} onChange={e => setEmail(e.target.value)} required />
              <input className="form-input" type="text" placeholder="ZIP code (optional)" value={zip} onChange={e => setZip(e.target.value)} maxLength={5} />
              <button className="btn btn-primary" type="submit" disabled={subLoading}>
                {subLoading ? 'Signing up...' : 'Sign Me Up'}
              </button>
            </form>
            <p style={{color:'var(--text-dim)',fontSize:'0.78rem',marginTop:12,textTransform:'none',fontFamily:'Lato',letterSpacing:0}}>
              We never sell or share your info. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:'64px 0',textAlign:'center'}}>
        <div className="container">
          <h2 style={{fontSize:'2rem',marginBottom:12}}>"Action is the antidote for despair"</h2>
          <p style={{color:'var(--text-muted)',marginBottom:28,textTransform:'none',fontFamily:'Lato',letterSpacing:0,fontWeight:400}}>
            Create a free account to access the full member hub.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">Create Your Account</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{background:'var(--bg2)',borderTop:'1px solid var(--border)',padding:'24px 0',textAlign:'center'}}>
        <div className="container">
          <p style={{color:'var(--text-dim)',fontSize:'0.8rem',fontFamily:'Oswald',letterSpacing:'0.08em',textTransform:'uppercase'}}>
            © 2026 CT Visibility Brigade · Part of the{' '}
            <a href="https://www.visibilitybrigade.com" target="_blank" rel="noopener noreferrer" style={{color:'var(--primary-light)'}}>
              National Visibility Brigade
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
