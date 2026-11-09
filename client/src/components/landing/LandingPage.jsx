import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { LandingNavbar } from './LandingNavbar';
import { LandingHero } from './LandingHero';
import { LandingAbout } from './LandingAbout';
import { LandingCourses } from './LandingCourses';
import { LandingGallery } from './LandingGallery';
import { LandingTestimonials } from './LandingTestimonials';
import { LandingFAQ } from './LandingFAQ';
import { LandingContact } from './LandingContact';
import { LandingFloatingActions } from './LandingFloatingActions';
import { LandingFooter } from './LandingFooter';
import { LandingBookingModal } from './LandingBookingModal';
import { StaffLoginModal } from './StaffLoginModal';

export function LandingPage() {
  const { loginUser } = useApp();
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedCourseForBooking, setSelectedCourseForBooking] = useState(null);

  // Global Keyboard Listener for Ctrl + Shift + S
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Ctrl+Shift+S or Cmd+Shift+S (Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        setIsStaffModalOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleEnrollCourse = (course) => {
    setSelectedCourseForBooking(course);
    setIsBookingModalOpen(true);
  };

  const handleOpenDemoBooking = () => {
    setSelectedCourseForBooking(null);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Navbar */}
      <LandingNavbar
        onBookNow={handleOpenDemoBooking}
        onOpenStaffPortal={() => setIsStaffModalOpen(true)}
      />

      {/* Hero Section */}
      <LandingHero
        onBookDemo={handleOpenDemoBooking}
        onExploreCourses={() => {
          document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* About ShivSamarth Academy */}
      <LandingAbout />

      {/* Training Courses & Pricing Packages */}
      <LandingCourses onEnroll={handleEnrollCourse} />

      {/* Real Fleet & Training Track Gallery */}
      <LandingGallery />

      {/* Student Testimonials & First-Attempt Reviews */}
      <LandingTestimonials />

      {/* Frequently Asked Questions */}
      <LandingFAQ />

      {/* Contact & Free Demo Booking Form (Connected to Leads Engine) */}
      <LandingContact />

      {/* Comprehensive SEO Footer */}
      <LandingFooter onOpenStaffPortal={() => setIsStaffModalOpen(true)} />

      {/* Floating Action Quick Dialers */}
      <LandingFloatingActions onBookNow={handleOpenDemoBooking} />

      {/* Booking / Trial Modal */}
      <LandingBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        initialCourse={selectedCourseForBooking}
      />

      {/* Secret Staff Login Modal (Ctrl+Shift+S Gateway) */}
      <StaffLoginModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onLoginSuccess={(user, token) => {
          loginUser(user, token);
        }}
      />

    </div>
  );
}
