import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { register } from '../../services/authService'
import { getGoogleLoginUrl, getGoogleStatus } from '../../services/authExpansionService'

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', organization: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleEnabled, setGoogleEnabled] = useState(false)

  useEffect(() => {
    getGoogleStatus().then((status) => setGoogleEnabled(status.enabled)).catch(() => setGoogleEnabled(false))
  }, [])

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      await register({ name: form.name, email: form.email, password: form.password, organization: form.organization || null })
      navigate('/login', { replace: true })
    } catch (registrationError) {
      setError(registrationError.message || 'Unable to register.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {['name', 'email', 'organization'].map((name) => (
          <input key={name} name={name} type={name === 'email' ? 'email' : 'text'} required={name !== 'organization'} value={form[name]} onChange={update} placeholder={name[0].toUpperCase() + name.slice(1)} className="w-full rounded-lg border border-slate-300 px-4 py-3" />
        ))}
        <input name="password" type="password" minLength="8" required value={form.password} onChange={update} placeholder="Password" className="w-full rounded-lg border border-slate-300 px-4 py-3" />
        <input name="confirmPassword" type="password" minLength="8" required value={form.confirmPassword} onChange={update} placeholder="Confirm password" className="w-full rounded-lg border border-slate-300 px-4 py-3" />
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button disabled={submitting} className="w-full rounded-lg bg-blue-900 px-4 py-3 text-white disabled:opacity-50">{submitting ? 'Creating...' : 'Register'}</button>
        {googleEnabled && (
          <button
            type="button"
            onClick={() => window.location.assign(getGoogleLoginUrl())}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 font-medium text-slate-700"
          >
            Continue with Google
          </button>
        )}
      </form>
      <Link to="/login" className="mt-6 inline-block text-blue-900 underline">Back to login</Link>
    </main>
  )
}

export default Register