import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-gray-100 dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-6">
        
        {/* Contact & Portfolio */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Aryan 
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
            Full-Stack Developer
          </p>
          <a
            href="mailto:aryanmalik20197@gmail.com"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline block"
          >
            aryanmalik20197@gmail.com
          </a>
          <a
            href="https://name-is-aryan.vercel.app/" // 🔁 Replace with your portfolio
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
          >
            Visit Portfolio →
          </a>
        </div>

        {/* Copyright */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} ML Visualiser. Built with by Aryan .
        </div>
      </div>
    </footer>
  );
}
