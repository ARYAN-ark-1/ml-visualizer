import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'  // Use BrowserRouter instead of HashRouter
import Home from './pages/Home'
import KMeans from './pages/KMeans'
import Hierarchical from './pages/Heirarchical'
import './index.css'
import { DarkModeProvider } from './context/DarkModeContext'
import Navbar from './components/Navbar'

function App() {
  return (
    <DarkModeProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/kmeans" element={<KMeans />} />
          <Route path="/hierarchical" element={<Hierarchical />} />
        </Routes>
      </BrowserRouter>
    </DarkModeProvider>
  )
}

export default App
