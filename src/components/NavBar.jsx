import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function NavBar() {
  const { user, profile, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/')
    setOpen(false)
  }

  const initials = profile?.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : profile?.email?.slice(0, 2).toUpperCase() || 'VB'

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-inner">
          <NavLink to={user ? '/dashboard' : '/'} className="nav-logo" onClick={() => setOpen(false)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            CT <span>VISIBILITY</span> BRIGADE
          </NavLink>

          <button className="nav-toggle" onClick={() => setOpen(o => !o)} aria-label="Menu">
            {open ? '✕' : '☰'}
          </button>

          <div className={`nav-links ${open ? 'open' : ''}`}>
            {user ? (
              <>
                <NavLink to="/dashboard" className={({isActive}) => `nav-link${isActive?' active':''}`} onClick={() => setOpen(false)}>Dashboard</NavLink>
                <NavLink to="/events" className={({isActive}) => `nav-link${isActive?' active':''}`} onClick={() => setOpen(false)}>Events</NavLink>
                <NavLink to="/board" className={({isActive}) => `nav-link${isActive?' active':''}`} onClick={() => setOpen(false)}>Board</NavLink>
                {isAdmin && <NavLink to="/admin" className={({isActive}) => `nav-link${isActive?' active':''}`} onClick={() => setOpen(false)}>Admin</NavLink>}
                <NavLink to="/profile" className={({isActive}) => `nav-link${isActive?' active':''}`} onClick={() => setOpen(false)}>
                  <div className="avatar avatar-sm" style={{marginRight: 4}}>{initials}</div>
                  Profile
                </NavLink>
                <button className="btn btn-outline btn-sm" onClick={signOut}>Sign Out</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={({isActive}) => `nav-link${isActive?' active':''}`} onClick={() => setOpen(false)}>Sign In</NavLink>
                <NavLink to="/register" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>Join Us</NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
