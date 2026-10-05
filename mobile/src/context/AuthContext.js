import { createContext, useContext, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

import { loginRequest, getCurrentUser } from '../api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'e_manaksetu_officer_token'

async function saveToken(token) {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token)
    return
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

async function getToken() {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY)
  }

  return await SecureStore.getItemAsync(TOKEN_KEY)
}

async function removeToken() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY)
    return
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    restoreSession()
  }, [])

  async function restoreSession() {
    try {
      const storedToken = await getToken()

      if (!storedToken) {
        return
      }

      const currentUser = await getCurrentUser(storedToken)

      if (currentUser?.role !== 'OFFICER') {
        await removeToken()
        return
      }

      setToken(storedToken)
      setUser(currentUser)
    } catch {
      await removeToken()
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email, password) {
    const response = await loginRequest(email, password)

    if (!response?.access_token) {
      throw new Error('Login succeeded but no access token was returned.')
    }

    const currentUser = await getCurrentUser(response.access_token)

    if (currentUser?.role !== 'OFFICER') {
      throw new Error('This account is not a field officer account.')
    }

    await saveToken(response.access_token)

    setToken(response.access_token)
    setUser(currentUser)

    return currentUser
  }

  async function signOut() {
    await removeToken()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}