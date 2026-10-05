import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Link } from 'react-router'

import { useAuth } from '../../context/AuthContext'
import { getGoogleLoginUrl, getGoogleStatus } from '../../services/authExpansionService'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleEnabled, setGoogleEnabled] = useState(false)

  useEffect(() => {
    getGoogleStatus().then((status) => setGoogleEnabled(status.enabled)).catch(() => setGoogleEnabled(false))
  }, [])

  function updateField(event) {
    const { name, value } = event.target
    setCredentials((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const user = await login(credentials)
      navigate(`/${user.role.toLowerCase()}`, { replace: true })
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to the Legal Metrology Platform
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>

            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={credentials.email}
              onChange={updateField}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>

            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={credentials.password}
              onChange={updateField}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-900 px-4 py-3 font-medium text-white hover:bg-blue-800"
          >
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>

          {googleEnabled && (
            <button
              type="button"
              onClick={() => window.location.assign(getGoogleLoginUrl())}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 font-medium text-slate-700"
            >
              Continue with Google
            </button>
          )}

          <a href="/forgot-password" className="block text-center text-sm text-blue-900 underline">
            Forgot password?
          </a>
          <Link to="/register" className="block text-center text-sm text-blue-900 underline">
            Create an account
          </Link>
        </form>
      </div>
    </div>
  )
}

export default Login