import React from 'react';
import { Link } from 'react-router-dom';

const algorithms = [
  { name: 'KMeans Clustering', path: '/kmeans' },
  { name: 'Hierarchical Clustering', path: '/hierarchical' },
];

export default function AlgorithmSection() {
  return (
    <section
      className="w-full py-20"
      id="algorithms"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
        {algorithms.map(({ name, path }) => (
          <Link
            key={path}
            to={path}
            className="block rounded-lg border border-gray-300 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300 bg-white dark:bg-gray-800"
          >
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              {name}
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Click to explore the {name} visualization
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
