import React, { useState, useEffect } from 'react';
import { Menu, X, Shield, Phone, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';

export function LandingNavbar({ onBookNow, onOpenStaffPortal }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Courses', href: '#courses' },
    { name: 'Fleet & Track', href: '#gallery' },
    { name: 'Reviews', href: '#reviews' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Admission', href: '#contact' },
  ];

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const targetElement = document.querySelector(href);
    if (targetElement) {
      const offset = 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-200/80 py-3'
          : 'bg-white/80 backdrop-blur-sm border-b border-slate-100 py-3.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo & Name */}
          <a href="#home" onClick={(e) => handleLinkClick(e, '#home')}>
            <Logo lightText={false} />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action Tools: Single Clear Phone Link + CTA + Staff Key */}
          <div className="hidden sm:flex items-center gap-3">
            
            {/* Consolidated Single Clear Top-Nav Phone Link */}
            <a
              href="tel:+918507075555"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-semibold text-xs sm:text-sm transition-colors"
              title="Call ShivSamarth Desk"
            >
              <Phone className="w-3.5 h-3.5 text-amber-600" />
              <span>+91 85070 75555</span>
            </a>

            {/* Secret Staff Portal Trigger */}
            <button
              onClick={onOpenStaffPortal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors"
              title="Staff Portal (Shortcut: Ctrl + Shift + S)"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Staff</span>
              <kbd className="hidden xl:inline text-[10px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-mono border border-slate-200">
                Ctrl+Shift+S
              </kbd>
            </button>

            {/* Book Demo Slot CTA */}
            <button
              onClick={onBookNow}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-semibold text-xs sm:text-sm shadow-xs transition-colors"
            >
              <span>Book Free Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={onOpenStaffPortal}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              title="Staff Login"
            >
              <Shield className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-2 animate-fade-in shadow-lg">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                {link.name}
              </a>
            ))}
          </nav>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <a
              href="tel:+918507075555"
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 text-slate-800 font-semibold text-sm"
            >
              <Phone className="w-4 h-4 text-amber-600" />
              <span>+91 85070 75555</span>
            </a>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onBookNow();
              }}
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-sm"
            >
              Book Free Demo
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
