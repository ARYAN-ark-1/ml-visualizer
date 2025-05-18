import React from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import AlgorithmSection from '../components/AlgorithSection'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <div className="w-full">
      {/* Fixed but slightly below top Navbar */}
      <div className="fixed top-5 left-0 w-full z-50">
        <Navbar />
      </div>

      {/* Content pushed below navbar */}
      <div className="pt-24">
        <Hero />
        <AlgorithmSection />
        <Footer />
      </div>
    </div>
  )
}
