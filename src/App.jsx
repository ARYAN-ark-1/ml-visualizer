import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { DarkModeProvider } from './context/DarkModeContext'
import Navbar from './components/Navbar'

// Lazy load pages for performance
const Home = lazy(() => import('./pages/Home'))
const KMeans = lazy(() => import('./pages/KMeans'))
const Hierarchical = lazy(() => import('./pages/Heirarchical'))
const FPGrowth = lazy(() => import('./pages/FPGrowth'))
const Apriori = lazy(() => import('./pages/Apriori'))

// Loading fallback component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
  </div>
)

function App() {
  return (
    <DarkModeProvider>
      <BrowserRouter>
        <Navbar />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/kmeans" element={<KMeans />} />
            <Route path="/hierarchical" element={<Hierarchical />} />
            <Route path="/fpgrowth" element={<FPGrowth />} />
            <Route path="/apriori" element={<Apriori />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </DarkModeProvider>
  )
}

export default App
