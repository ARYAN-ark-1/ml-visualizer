import React from 'react';
import bgImage from '../assets/bg-image.jpg';

export default function Hero() {
  return (
    <section className="w-full relative overflow-hidden bg-background">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-accent opacity-10 blur-3xl rounded-full"></div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 flex flex-col md:flex-row items-center justify-between min-h-[70vh] py-12 md:py-20 relative z-10">

        {/* Text content */}
        <div className="flex-1 max-w-full md:max-w-lg text-center md:text-left space-y-6">
          <div className="inline-block px-3 py-1 rounded-full bg-accent-highlight text-accent text-xs font-bold tracking-wider uppercase mb-2">
            Interactive Learning
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight text-primary tracking-tight">
            Explore <span className="text-accent">Clustering</span> Algorithms
          </h1>
          <p className="text-lg sm:text-xl text-secondary leading-relaxed">
            Visualize and understand how popular clustering algorithms like KMeans and Hierarchical Clustering work through interactive demos.
          </p>
          <div className="pt-4">
            <a
              href="#algorithms"
              className="inline-block px-8 py-4 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              Start Exploring
            </a>
          </div>
        </div>

        {/* Image content */}
        <div className="flex-1 mt-12 md:mt-0 flex justify-center perspective-1000">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <img
              src={bgImage}
              alt="Clustering Illustration"
              className="relative w-full max-w-md object-contain rounded-xl shadow-2xl border border-border/50 bg-surface transform transition-transform duration-500 hover:scale-[1.02]"
              loading="lazy"
              style={{ filter: 'brightness(0.95)' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
