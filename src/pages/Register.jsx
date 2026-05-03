import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', confirm: '', full_name: '', display_name: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          display_name: form.display_name || form.full_name.split(' ')[0] || form.email.split('@')[0]
        }
      }
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="page">
      <div className="container" style={{maxWidth:480}}>
        <div className="page-header text-center">
          <h1 className="page-title">Join the Brigade</h1>
          <p className="page-subtitle">Create your member account for the CT Visibility Brigade hub.</p>
        </div>

        <div className="card">
          {error && <div className="alert alert-error mb-2">{error}</div>}
          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" value={form.full_name} onChange={update('full_name')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input className="form-input" type="text" placeholder="How you'll appear" value={form.display_name} onChange={update('display_name')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={update('email')} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={form.password} onChange={update('password')} required autoComplete="new-password" minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-input" type="password" value={form.confirm} onChange={update('confirm')} required autoComplete="new-password" />
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center mt-2 text-muted text-sm">
          Already a member?{' '}
          <Link to="/login" style={{color:'var(--primary-light)'}}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
