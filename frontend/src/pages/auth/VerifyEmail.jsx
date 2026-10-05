import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import { verifyEmail } from '../../services/authExpansionService'

function VerifyEmail() {
  const [params] = useSearchParams()
  const [message, setMessage] = useState('Verifying email...')

  useEffect(() => {
    verifyEmail(params.get('token') || '')
      .then((response) => setMessage(response.message))
      .catch((error) => setMessage(error.message || 'Unable to verify email.'))
  }, [params])

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-bold text-slate-900">Email verification</h1>
      <p className="mt-4 text-slate-700">{message}</p>
      <Link to="/login" className="mt-6 inline-block text-blue-900 underline">Continue to login</Link>
    </main>
  )
}

export default VerifyEmail