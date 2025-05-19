import React, { useEffect, useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { DarkModeContext } from '../context/DarkModeContext'

export default function Navbar() {
  const [show, setShow] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const { darkMode, setDarkMode } = useContext(DarkModeContext) // Use context here

  // Hide navbar on scroll down, show on scroll up
  useEffect(() => {
    const controlNavbar = () => {
      if (window.scrollY > lastScrollY) {
        setShow(false)
      } else {
        setShow(true)
      }
      setLastScrollY(window.scrollY)
    }
    window.addEventListener('scroll', controlNavbar)
    return () => window.removeEventListener('scroll', controlNavbar)
  }, [lastScrollY])

  // No need for darkMode useEffect here; context handles that

  // Close menu on window resize (desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 w-full bg-white dark:bg-gray-900 shadow-md z-50 transition-transform duration-300 ${
        show ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white cursor-default">
              ML Visualizer
            </h1>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link
              to="/"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              Home
            </Link>
            <Link
              to="/kmeans"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              KMeans
            </Link>
            <Link
              to="/hierarchical"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              Hierarchical
            </Link>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-4 py-1 border border-gray-700 dark:border-gray-300 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="Toggle dark mode"
            >
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              type="button"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition"
            >
              {menuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg absolute w-full left-0 transition-max-height duration-300 ease-in-out overflow-hidden ${
          menuOpen ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="flex flex-col px-4 py-3 space-y-1">
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition"
          >
            Home
          </Link>
          <Link
            to="/kmeans"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition"
          >
            KMeans
          </Link>
          <Link
            to="/hierarchical"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition"
          >
            Hierarchical
          </Link>
          <button
            onClick={() => {
              setDarkMode(!darkMode)
              setMenuOpen(false)
            }}
            className="w-full text-left px-3 py-2 rounded-md border-t border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition font-semibold"
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>
    </nav>
  )
}
