import React from 'react';
import bgImage from '../assets/bg-image.jpg';

export default function Hero() {
  return (
    <section className="w-screen hero-section">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between min-h-[80vh] py-20">
        <div className="flex-1 max-w-lg">
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">
            Explore Clustering Algorithms
          </h1>
          <p className="mb-8 text-lg opacity-90">
            Visualize and understand how popular clustering algorithms like KMeans and Hierarchical Clustering work.
          </p>
          <a href="#algorithms" className="hero-explore-btn">
            Explore
          </a>
        </div>
        <div className="flex-1 mt-12 md:mt-0 flex justify-center">
          
          <img
            src={bgImage}
            alt="Clustering Illustration"
            className="w-full max-w-md"
            class="professional-image"
            loading="lazy"
            style={{ filter: 'brightness(0.9)' }}
          />
        </div>
      </div>
    </section>
  );
}
