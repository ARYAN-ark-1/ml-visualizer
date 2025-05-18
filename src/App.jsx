import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import KMeans from './pages/KMeans'
import Hierarchical from './pages/Heirarchical'
import './index.css'; 
import { HashRouter} from 'react-router-dom'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/kmeans" element={<KMeans />} />
        <Route path="/hierarchical" element={<Hierarchical />} />
      </Routes>
    </HashRouter>
  )
}

export default App
