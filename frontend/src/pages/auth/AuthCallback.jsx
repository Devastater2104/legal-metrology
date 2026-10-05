import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { useAuth } from '../../context/AuthContext'

function AuthCallback() {
  const navigate = useNavigate()
  const { loginWithToken } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const token = params.get('access_token')
    if (!token) {
      setError('Google login did not return a valid session.')
      return
    }
    loginWithToken(token)
      .then((user) => navigate(`/${user.role.toLowerCase()}`, { replace: true }))
      .catch(() => setError('Unable to complete Google login.'))
  }, [loginWithToken, navigate])

  return <p className="p-8 text-slate-600">{error || 'Completing sign in...'}</p>
}

export default AuthCallback