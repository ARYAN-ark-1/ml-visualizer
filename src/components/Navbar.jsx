import React, { useEffect, useState, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DarkModeContext } from '../context/DarkModeContext';
import logo from '../assets/logo.png';

export default function Navbar() {
  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { darkMode, setDarkMode } = useContext(DarkModeContext);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Scroll hide/show
  useEffect(() => {
    const controlNavbar = () => {
      setShow(window.scrollY <= lastScrollY);
      setLastScrollY(window.scrollY);
    };
    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  // Collapse mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <nav
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 max-w-7xl w-[calc(100%-2rem)] bg-white dark:bg-gray-900 shadow-md z-50 transition-all duration-700 ease-in-out rounded-md ${
        show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div
            className="flex-shrink-0 flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/')}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate('/')}
          >
            <img
              src={logo}
              alt="ML Visualizer Logo"
              className="h-10 w-10 object-cover rounded-full hover:scale-105 transition-transform duration-300"
            />
            <span className="hidden md:inline text-xl font-bold text-gray-900 dark:text-white">
              ML Visualizer
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6 items-center relative" ref={dropdownRef}>
            {/* Portfolio Link */}
            <a
              href="https://name-is-aryan.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              Portfolio
            </a>

            {/* Algorithms Dropdown */}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center"
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              aria-controls="algorithms-menu"
              id="algorithms-button"
              type="button"
            >
              Algorithms
              <svg
                className={`ml-1 h-4 w-4 transform transition-transform ${dropdownOpen ? 'rotate-180' : 'rotate-0'}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div
                id="algorithms-menu"
                role="menu"
                aria-labelledby="algorithms-button"
                className="absolute top-10 left-0 mt-1 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md z-50"
              >
                {['kmeans', 'hierarchical', 'fpgrowth', 'apriori'].map((algo) => (
                  <Link
                    key={algo}
                    to={`/${algo}`}
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 capitalize"
                  >
                    {algo}
                  </Link>
                ))}
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-4 py-1 border border-gray-700 dark:border-gray-300 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="Toggle dark mode"
              type="button"
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
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none transition"
            >
              {menuOpen ? (
                <svg className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" fill="none">
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
          {/* Portfolio Link (Mobile) */}
          <a
            href="https://your-portfolio-url.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900"
          >
            Portfolio
          </a>

          {/* Algorithms */}
          {['kmeans', 'hierarchical', 'fpgrowth', 'apriori'].map((algo) => (
            <Link
              key={algo}
              to={`/${algo}`}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 capitalize"
            >
              {algo}
            </Link>
          ))}

          {/* Dark Mode Toggle */}
          <button
            onClick={() => {
              setDarkMode(!darkMode);
              setMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-md border-t border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 font-semibold"
            type="button"
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>
    </nav>
  );
}
