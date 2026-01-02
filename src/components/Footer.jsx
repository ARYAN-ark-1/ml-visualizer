import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-surface border-t border-border py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-6">

        {/* Contact & Portfolio */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-2">
            Aryan | Full-Stack Developer
          </h3>
          <div className="flex flex-col gap-1">
            <a
              href="mailto:aryanmalik20197@gmail.com"
              className="text-sm text-secondary hover:text-accent transition-colors block"
            >
              aryanmalik20197@gmail.com
            </a>
            <a
              href="https://name-is-aryan.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-secondary hover:text-accent transition-colors flex items-center gap-1 justify-center sm:justify-start"
            >
              Portfolio <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-sm text-muted">
          &copy; {new Date().getFullYear()} ML Visualizer. Built with care by Aryan.
        </div>
      </div>
    </footer>
  );
}
