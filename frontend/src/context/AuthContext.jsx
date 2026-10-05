import { createContext, useCallback, useContext, useEffect, useState } from 'react'

import * as authService from '../services/authService'

const TOKEN_KEY = 'legal_metrology_token'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    authService.getCurrentUser(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const loginWithToken = useCallback(async (accessToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken)
    setToken(accessToken)
    const currentUser = await authService.getCurrentUser(accessToken)
    setUser(currentUser)
    return currentUser
  }, [])

  const login = useCallback(async (credentials) => {
    const session = await authService.login(credentials)
    return loginWithToken(session.access_token)
  }, [loginWithToken])

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        loading,
        login,
        loginWithToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }

  return context
}
