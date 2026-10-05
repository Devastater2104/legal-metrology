import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import { resetPassword } from '../../services/authExpansionService'

function ResetPassword() {
  const [params] = useSearchParams()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      const response = await resetPassword(params.get('token') || '', password)
      setMessage(response.message)
    } catch (resetError) {
      setError(resetError.message)
    }
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input type="password" required minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" className="w-full rounded-lg border border-slate-300 px-4 py-3" />
        <button className="w-full rounded-lg bg-blue-900 px-4 py-3 text-white">Reset password</button>
      </form>
      {message && <p className="mt-4 text-green-700">{message}</p>}
      {error && <p className="mt-4 text-red-600" role="alert">{error}</p>}
      <Link to="/login" className="mt-6 inline-block text-blue-900 underline">Back to login</Link>
    </main>
  )
}

export default ResetPassword