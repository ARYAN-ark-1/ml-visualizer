import React from 'react';
import { Link } from 'react-router-dom';

const algorithms = [
  { name: 'KMeans Clustering', path: '/kmeans' },
  { name: 'Hierarchical Clustering', path: '/hierarchical' },
  { name: 'FP-Growth', path: '/fpgrowth' },
  { name: 'Apriori', path: '/apriori' },  // Added Apriori here
];

export default function AlgorithmSection() {
  return (
    <section
      className="w-full py-24 bg-background"
      id="algorithms"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-4">
            Available Algorithms
          </h2>
          <p className="text-secondary max-w-2xl mx-auto text-lg">
            Select an algorithm to visualize its step-by-step execution process.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {algorithms.map(({ name, path }) => (
            <Link
              key={path}
              to={path}
              className="group block rounded-2xl border border-border bg-surface p-8 hover:shadow-xl hover:border-accent/30 transition-all duration-300 relative overflow-hidden"
            >
              {/* Decorative element removed per user feedback */}

              <h2 className="text-xl font-bold mb-3 text-primary group-hover:text-accent transition-colors">
                {name}
              </h2>
              <p className="text-secondary text-sm leading-relaxed mb-6">
                Interactive visualization for {name} algorithm.
              </p>

              <div className="flex items-center text-accent text-sm font-semibold group-hover:translate-x-1 transition-transform">
                Launch Demo <span className="ml-1">&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
