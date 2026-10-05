import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Link } from 'react-router'

import { useAuth } from '../../context/AuthContext'
import {
  getGoogleLoginUrl,
  getGoogleStatus,
} from '../../services/authExpansionService'

function GoogleIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.71-.06-1.39-.18-2.05H12v3.88h5.22a4.46 4.46 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.93-4.18 2.93-7.19Z"
      />
      <path
        fill="#34A853"
        d="M12 21.75c2.63 0 4.84-.87 6.45-2.34l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.5A9.75 9.75 0 0 0 12 21.75Z"
      />
      <path
        fill="#FBBC05"
        d="M6.54 13.87A5.86 5.86 0 0 1 6.23 12c0-.65.11-1.28.31-1.87v-2.5H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.37l3.24-2.5Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.1c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.83 3.22 14.62 2.25 12 2.25A9.75 9.75 0 0 0 3.3 7.63l3.24 2.5C7.31 7.82 9.46 6.1 12 6.1Z"
      />
    </svg>
  )
}

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  })

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleEnabled, setGoogleEnabled] = useState(false)

  useEffect(() => {
    getGoogleStatus()
      .then((status) => setGoogleEnabled(status.enabled))
      .catch(() => setGoogleEnabled(false))
  }, [])

  function updateField(event) {
    const { name, value } = event.target

    setCredentials((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const user = await login(credentials)

      navigate(`/${user.role.toLowerCase()}`, {
        replace: true,
      })
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
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
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
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && (
            <p
              className="text-sm text-red-600"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-900 px-4 py-3 font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>

          {googleEnabled && (
            <>
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-slate-200" />

                <span className="mx-3 text-xs text-slate-400">
                  OR
                </span>

                <div className="flex-grow border-t border-slate-200" />
              </div>

              <button
                type="button"
                onClick={() =>
                  window.location.assign(getGoogleLoginUrl())
                }
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100"
              >
                <GoogleIcon />

                <span>
                  Login with Google
                </span>
              </button>
            </>
          )}

          <a
            href="/forgot-password"
            className="block text-center text-sm text-blue-900 underline"
          >
            Forgot password?
          </a>

          <Link
            to="/register"
            className="block text-center text-sm text-blue-900 underline"
          >
            Create an account
          </Link>

        </form>
      </div>
    </div>
  )
}

export default Login