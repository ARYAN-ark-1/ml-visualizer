import React from 'react';
import { Link } from 'react-router-dom';

const algorithms = [
  { name: 'KMeans Clustering', path: '/kmeans' },
  { name: 'Hierarchical Clustering', path: '/hierarchical' },
];

export default function AlgorithmSection() {
  return (
    <section className="w-screen py-20" id="algorithms" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {algorithms.map(({ name, path }) => (
          <Link key={path} to={path} className="algorithm-card">
            <h2 className="text-2xl font-semibold mb-2">{name}</h2>
            <p>Click to explore the {name} visualization</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
