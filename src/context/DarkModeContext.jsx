import React, { createContext, useState, useEffect } from 'react'

export const DarkModeContext = createContext()

export function DarkModeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedMode)
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  )
}
