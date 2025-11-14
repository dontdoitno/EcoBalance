import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Загружаем пользователя из localStorage
    const savedUser = localStorage.getItem('ecobalance_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = (email, password) => {
    // В реальном приложении здесь будет API запрос
    const userData = {
      email,
      id: Date.now().toString(),
      name: email.split('@')[0],
    }
    setUser(userData)
    localStorage.setItem('ecobalance_user', JSON.stringify(userData))
    return Promise.resolve(userData)
  }

  const register = (email, password, companyName) => {
    // В реальном приложении здесь будет API запрос
    const userData = {
      email,
      id: Date.now().toString(),
      name: companyName || email.split('@')[0],
      company: {
        name: companyName || '',
        industry: '',
        size: '',
        region: '',
      },
    }
    setUser(userData)
    localStorage.setItem('ecobalance_user', JSON.stringify(userData))
    return Promise.resolve(userData)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('ecobalance_user')
  }

  const updateProfile = (profileData) => {
    const updatedUser = {
      ...user,
      company: {
        ...user.company,
        ...profileData,
      },
    }
    setUser(updatedUser)
    localStorage.setItem('ecobalance_user', JSON.stringify(updatedUser))
  }

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
