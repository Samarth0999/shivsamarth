import React from 'react';
import { Shield, MapPin, Phone, Clock } from 'lucide-react';
import { Logo } from './Logo';

export function LandingFooter({ onOpenStaffPortal }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 pt-14 pb-10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          
          {/* Brand & Summary (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Logo lightText={true} />

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm pt-1">
              Beed district’s premier driving academy since 2011. Certified dual-control training fleet, 1-on-1 practical coaching, female instructors, and 100% RTO license support.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono text-amber-400">
                RTO Code: MH-23 (Beed)
              </span>
              <span className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800/80 text-[11px] font-semibold text-emerald-400">
                Govt. Authorized
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3.5">Quick Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#home" className="hover:text-white transition-colors">Home Overview</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">About Academy</a></li>
              <li><a href="#courses" className="hover:text-white transition-colors">Training Packages</a></li>
              <li><a href="#gallery" className="hover:text-white transition-colors">Fleet & Track Gallery</a></li>
              <li><a href="#reviews" className="hover:text-white transition-colors">Student Testimonials</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Help & FAQ</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Free Demo Booking</a></li>
            </ul>
          </div>

          {/* Training Packages */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3.5">Popular Courses</h4>
            <ul className="space-y-2 text-xs">
              <li className="text-slate-300">26 Days With License (Complete Package)</li>
              <li className="text-slate-300">26 Days Practical Road Training</li>
              <li className="text-slate-300">Only License Fast-Track Assistance</li>
              <li className="text-amber-400 font-semibold pt-1">Lady Instructor Batch</li>
              <li className="text-amber-400 font-semibold">Weekend Executive Batch</li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3.5">Our Two Branches</h4>
            <div className="space-y-3 text-xs">
              <div>
                <p className="font-bold text-slate-200">1) ShivSamarth Main Branch</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Satyabhama Complex, Swaraj Nagar, Beed</p>
                <a href="tel:+918507075555" className="text-amber-400 hover:text-white transition-colors font-mono text-[11px]">
                  +91 85070 75555
                </a>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <p className="font-bold text-slate-200">2) ShriYash Branch</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Infront of Lokmat office, Sahayog Nagar, Beed</p>
                <a href="tel:+919420635355" className="text-amber-400 hover:text-white transition-colors font-mono text-[11px]">
                  +91 94206 35355
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar with Secret Staff Portal Gateway */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          
          <div className="text-slate-500 text-center sm:text-left">
            <span>© {currentYear} ShivSamarth Motor Driving School. All rights reserved.</span>
          </div>

          {/* Secret Staff Gateway Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenStaffPortal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-400 hover:text-white transition-colors"
              title="Staff Portal (Shortcut: Ctrl + Shift + S)"
            >
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Staff Portal</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[9px] font-mono text-slate-400">
                Ctrl+Shift+S
              </kbd>
            </button>
          </div>

        </div>

      </div>
    </footer>
  );
}
