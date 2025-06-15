import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'  // Use BrowserRouter instead of HashRouter
import Home from './pages/Home'
import KMeans from './pages/KMeans'
import Hierarchical from './pages/Heirarchical'
import './index.css'
import { DarkModeProvider } from './context/DarkModeContext'
import Navbar from './components/Navbar'
import FPGrowth from './pages/FPGrowth'
import Apriori from './pages/Apriori'

function App() {
  return (
    <DarkModeProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/kmeans" element={<KMeans />} />
          <Route path="/hierarchical" element={<Hierarchical />} />
          <Route path="/fpgrowth" element={<FPGrowth />} />
          <Route path="/apriori" element={<Apriori />} />
        </Routes>
      </BrowserRouter>
    </DarkModeProvider>
  )
}

export default App
