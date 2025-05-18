import React from 'react';

export default function Footer() {
  return (
    <footer className="w-screen footer-section">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between">
        <div className="footer-contact">
          <h3 className="text-lg font-semibold mb-2">Contact</h3>
          <p>Email: info@mlvisualiser.com</p>
          <p>Phone: +1 234 567 890</p>
        </div>
        <div className="mt-6 md:mt-0">
          <p>© 2025 ML Visualiser. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
