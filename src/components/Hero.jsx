import React from 'react';
import bgImage from '../assets/bg-image.jpg';

export default function Hero() {
  return (
    <section className="w-full hero-section">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 flex flex-col md:flex-row items-center justify-between min-h-[80vh] py-16 md:py-20">
        
        {/* Text content */}
        <div className="flex-1 max-w-full md:max-w-lg text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-5 leading-tight">
            Explore Clustering Algorithms
          </h1>
          <p className="mb-8 text-base sm:text-lg text-gray-700 dark:text-gray-300 opacity-90">
            Visualize and understand how popular clustering algorithms like KMeans and Hierarchical Clustering work.
          </p>
          <a
            href="#algorithms"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Explore
          </a>
        </div>

        {/* Image content */}
        <div className="flex-1 mt-12 md:mt-0 flex justify-center">
          <img
            src={bgImage}
            alt="Clustering Illustration"
            className="w-full max-w-xs sm:max-w-sm md:max-w-md object-contain rounded-md shadow-lg"
            loading="lazy"
            style={{ filter: 'brightness(0.9)' }}
          />
        </div>
      </div>
    </section>
  );
}
