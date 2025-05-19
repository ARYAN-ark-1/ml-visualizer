import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-gray-100 dark:bg-gray-900 py-6">
      <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col md:flex-row justify-between items-center md:items-start gap-6 md:gap-0">
        
        {/* Contact info */}
        <div className="text-center md:text-left">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Contact
          </h3>
          <p className="text-gray-700 dark:text-gray-300">Email: info@mlvisualiser.com</p>
          <p className="text-gray-700 dark:text-gray-300">Phone: +1 234 567 890</p>
        </div>

        {/* Copyright */}
        <div className="text-center md:text-right text-gray-600 dark:text-gray-400 text-sm">
          © 2025 ML Visualiser. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
