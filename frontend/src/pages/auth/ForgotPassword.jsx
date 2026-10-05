import { useState } from 'react'
import { Link } from 'react-router'

import { requestPasswordReset } from '../../services/authExpansionService'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      const response = await requestPasswordReset(email)
      setMessage(response.message)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-bold text-slate-900">Forgot password</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-lg border border-slate-300 px-4 py-3" />
        <button className="w-full rounded-lg bg-blue-900 px-4 py-3 text-white">Request reset</button>
      </form>
      {message && <p className="mt-4 text-green-700">{message}</p>}
      {error && <p className="mt-4 text-red-600" role="alert">{error}</p>}
      <Link to="/login" className="mt-6 inline-block text-blue-900 underline">Back to login</Link>
    </main>
  )
}

export default ForgotPassword