import React, { useState, useEffect } from 'react';
import { MessageCircle, ChevronUp } from 'lucide-react';

export function LandingFloatingActions({ onBookNow }) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-3 pointer-events-none">
      
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="pointer-events-auto w-9 h-9 rounded-full bg-white hover:bg-slate-50 text-slate-700 shadow-md border border-slate-200 flex items-center justify-center transition-all hover:-translate-y-0.5"
          title="Scroll to Top"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      )}

      {/* Single Consolidated Sticky WhatsApp Widget */}
      <a
        href="https://wa.me/918507075555?text=Hello%20ShivSamarth%20Driving%20School%2C%20I%20am%20interested%20in%20learning%20driving%20in%20Beed."
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all hover:scale-102 group"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-5 h-5 fill-white text-emerald-600" />
        <span className="text-xs font-semibold pr-1">WhatsApp Us</span>
      </a>

    </div>
  );
}
