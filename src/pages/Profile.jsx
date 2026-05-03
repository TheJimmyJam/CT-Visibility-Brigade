import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { format, parseISO } from 'date-fns'

export default function Profile() {
  const { profile, refreshProfile } = useAuth()
  const [form, setForm] = useState({ full_name: profile?.full_name || '', display_name: profile?.display_name || '', bio: profile?.bio || '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState(null)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))
  const updatePw = (field) => (e) => setPwForm(f => ({ ...f, [field]: e.target.value }))

  async function saveProfile(e) {
    e.preventDefault()
    setSaving(true); setError(null); setSaved(false)
    const { error } = await supabase.from('profiles').update(form).eq('id', profile.id)
    if (error) setError(error.message)
    else { setSaved(true); refreshProfile(); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  async function changePassword(e) {
    e.preventDefault()
    setPwError(null); setPwSaved(false)
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match.'); return }
    if (pwForm.next.length < 6) { setPwError('Password must be at least 6 characters.'); return }
    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pwForm.next })
    if (error) setPwError(error.message)
    else { setPwSaved(true); setPwForm({ current: '', next: '', confirm: '' }); setTimeout(() => setPwSaved(false), 3000) }
    setPwLoading(false)
  }

  const initials = (form.display_name || form.full_name || profile?.email || 'VB').slice(0, 2).toUpperCase()

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 560 }}>
        <div className="page-header">
          <h1 className="page-title">Your Profile</h1>
        </div>

        {/* Avatar + info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div className="avatar avatar-lg">{initials}</div>
          <div>
            <div style={{ fontFamily: 'Oswald', fontSize: '1.1rem', fontWeight: 600 }}>{profile?.display_name || profile?.full_name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{profile?.email}</div>
            <div style={{ marginTop: 4 }}>
              <span className={`badge ${profile?.role === 'admin' ? 'badge-admin' : 'badge-gray'}`}>{profile?.role}</span>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h3 style={{ fontSize: '1rem' }}>Edit Profile</h3>
          </div>
          {error && <div className="alert alert-error mb-2">{error}</div>}
          {saved && <div className="alert alert-success mb-2">Profile saved!</div>}
          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.full_name} onChange={update('full_name')} />
            </div>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input className="form-input" value={form.display_name} onChange={update('display_name')} placeholder="How you appear to other members" />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-textarea" value={form.bio} onChange={update('bio')} placeholder="A little about yourself (optional)" style={{ minHeight: 80 }} />
            </div>
            <div>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </div>

        {/* Change password */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem' }}>Change Password</h3>
          </div>
          {pwError && <div className="alert alert-error mb-2">{pwError}</div>}
          {pwSaved && <div className="alert alert-success mb-2">Password updated!</div>}
          <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" value={pwForm.next} onChange={updatePw('next')} minLength={6} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" type="password" value={pwForm.confirm} onChange={updatePw('confirm')} required />
            </div>
            <div>
              <button className="btn btn-outline" type="submit" disabled={pwLoading}>{pwLoading ? 'Updating...' : 'Update Password'}</button>
            </div>
          </form>
        </div>

        <div style={{ marginTop: 16 }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', textTransform: 'none', fontFamily: 'Lato', letterSpacing: 0 }}>
            Member since {profile?.joined_at ? format(parseISO(profile.joined_at), 'MMMM yyyy') : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}
