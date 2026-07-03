import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(null)
  const [token,   setToken]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken   = localStorage.getItem('prp_token')
    const savedStudent = localStorage.getItem('prp_student')
    try {
      if (savedToken && savedStudent && savedStudent !== 'undefined') {
        setToken(savedToken)
        setStudent(JSON.parse(savedStudent))
      }
    } catch (e) {
      console.error("Failed to parse saved student session:", e)
      localStorage.removeItem('prp_token')
      localStorage.removeItem('prp_student')
    }
    setLoading(false)
  }, [])

  function login(tokenVal, studentData) {
    localStorage.setItem('prp_token',   tokenVal)
    localStorage.setItem('prp_student', JSON.stringify(studentData))
    setToken(tokenVal)
    setStudent(studentData)
  }

  function logout() {
    localStorage.removeItem('prp_token')
    localStorage.removeItem('prp_student')
    setToken(null)
    setStudent(null)
  }

  return (
    <AuthContext.Provider value={{ student, token, loading, login, logout, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}