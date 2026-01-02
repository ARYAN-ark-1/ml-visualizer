import React, { useEffect, useState } from 'react'
import Hero from '../components/Hero'
import AlgorithmSection from '../components/AlgorithmSection'
import Footer from '../components/Footer'
import { trackVisit } from '../api/experiments'
import { FaUserFriends } from 'react-icons/fa'

export default function Home() {
  const [visitorCount, setVisitorCount] = useState(null);

  useEffect(() => {
    const initAnalytics = async () => {
      // Get or create unique visitor ID
      let visitorId = localStorage.getItem('ml_viz_visitor_id');
      if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem('ml_viz_visitor_id', visitorId);
      }

      const data = await trackVisit(visitorId);
      if (data && data.totalVisitors) {
        setVisitorCount(data.totalVisitors);
      }
    };

    initAnalytics();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-primary font-sans transition-colors duration-300">


      <main className="flex-grow pt-24 relative">
        {/* Analytics Badge */}
        {visitorCount !== null && (
          <div className="absolute top-28 right-6 z-20 animate-fade-in bg-surface/80 backdrop-blur-md border border-accent/20 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 group hover:scale-105 transition-transform duration-300">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <FaUserFriends className="text-accent text-sm" />
            <span className="text-xs font-bold text-primary">
              <span className="text-accent">{visitorCount.toLocaleString()}</span> Total Visitors
            </span>
          </div>
        )}

        <Hero />

        {/* Problem Statement Section */}
        <section className="w-full py-20 px-6 bg-surface border-y border-border">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">
              Why use this Visualizer?
            </h2>
            <p className="text-lg md:text-xl text-secondary leading-relaxed max-w-3xl mx-auto">
              Machine Learning algorithms often feel like "black boxes."
              Textbooks show math, but lack intuition.
              <br className="hidden md:block" />
              <span className="font-semibold text-accent">ML Visualizer</span> bridges the gap by letting you
              <span className="italic"> see</span> how data points move, cluster, and evolve step-by-step.
            </p>
          </div>
        </section>

        <AlgorithmSection />
      </main>

      <Footer />
    </div>
  )
}
