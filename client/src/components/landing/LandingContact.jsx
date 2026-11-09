import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, AlertCircle, Shield, Building2 } from 'lucide-react';

export function LandingContact() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    branch_id: '1',
    course_name: 'With License (26 Days Complete Package)',
    preferred_time: 'Morning (7:00 AM - 9:00 AM)',
    address: 'Beed',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          branch_id: Number(formData.branch_id) || 1,
          source: 'website_contact_form'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry');
      }

      setSubmitSuccess(data);
      setFormData({
        name: '',
        phone: '',
        email: '',
        branch_id: '1',
        course_name: 'With License (26 Days Complete Package)',
        preferred_time: 'Morning (7:00 AM - 9:00 AM)',
        address: 'Beed',
        message: ''
      });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-20 lg:py-24 bg-slate-50 border-t border-slate-200/80 text-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold mb-3 shadow-2xs">
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>Fast-Track Admission & RTO Support</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            Book Your Free Demo Session
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Experience our dual-control Maruti Brezza, sit with our patient instructor, and learn about the RTO licensing process. Zero obligation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left Column: Contact Cards & Info (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Primary Office Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                  <img
                    src="/images/IMG-20211120-WA0001-removebg-preview.png"
                    alt="ShivSamarth Emblem"
                    className="w-full h-full object-contain"
                    onError={(e) => { e.currentTarget.src = '/images/driving_school.png'; }}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-tight">
                    ShivSamarth Motor Driving Academy
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Govt. Authorized Driving Centers • Beed (MH-23)</p>
                </div>
              </div>

              {/* Branch 1 Details */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                    Branch 1: Main Campus
                  </span>
                  <a href="tel:+918507075555" className="text-xs font-bold text-slate-900 hover:text-amber-600">
                    +91 85070 75555
                  </a>
                </div>
                <h4 className="font-bold text-sm text-slate-900">ShivSamarth Main Branch</h4>
                <p className="text-xs text-slate-600 leading-snug">
                  Satyabhama Complex, Infront of Rashtrwadi Bhawan, Swaraj Nagar, Beed, Maharashtra 431122
                </p>
              </div>

              {/* Branch 2 Details */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                    Branch 2: City Center
                  </span>
                  <a href="tel:+919420635355" className="text-xs font-bold text-slate-900 hover:text-blue-600">
                    +91 94206 35355
                  </a>
                </div>
                <h4 className="font-bold text-sm text-slate-900">ShriYash Branch</h4>
                <p className="text-xs text-slate-600 leading-snug">
                  Infront of Lokmat office, Sahayog Nagar, Beed, Maharashtra 431122
                </p>
              </div>

              {/* Operating Hours */}
              <div className="flex items-center gap-3 pt-2 text-xs text-slate-600 border-t border-slate-100">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Operating Hours: <strong>6:00 AM – 8:00 PM</strong> (Open All 7 Days)</span>
              </div>
            </div>

            {/* Embedded Google Map Preview */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-medium text-slate-700">
                <span className="flex items-center gap-1.5 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  Shivaji Nagar Ground, Beed (MH-23)
                </span>
                <span className="text-[10px] text-emerald-700 font-bold uppercase">Training Ground Active</span>
              </div>
              <iframe
                title="ShivSamarth Driving School Location Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d60324.966952870425!2d75.71764359850122!3d18.990425662705036!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc51bdae54a5a57%3A0xc3f60b457e5b2259!2sBeed%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                className="w-full h-44 border-0 filter contrast-105"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

          </div>

          {/* Right Column: Lead Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              
              <div className="mb-6">
                <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900">Online Admission & Demo Booking</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Fill in your details below. Select your nearest branch and our supervisor will confirm your trial slot.
                </p>
              </div>

              {submitSuccess ? (
                <div className="p-7 rounded-xl bg-emerald-50 border border-emerald-200 text-center animate-fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-3 font-bold shadow-xs">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">Enquiry Received Successfully!</h4>
                  <p className="text-xs sm:text-sm text-emerald-800 mt-1.5">
                    {submitSuccess.message}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => setSubmitSuccess(null)}
                      className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs"
                    >
                      Submit Another Query
                    </button>
                    <a
                      href="https://wa.me/918507075555?text=Hello%20ShivSamarth%20Driving%20School%2C%20I%20just%20submitted%20an%20inquiry%20online%20and%20would%20like%20to%20confirm%20my%20demo%20slot."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                    >
                      Confirm on WhatsApp
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {errorMsg && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Branch Selection Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Select Training Branch *</span>
                    </label>
                    <select
                      name="branch_id"
                      value={formData.branch_id}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="1">1) ShivSamarth Main Branch (Swaraj Nagar, Beed) - +91 85070 75555</option>
                      <option value="2">2) ShriYash Branch (Sahayog Nagar, Beed) - +91 94206 35355</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Rameshwar Deshmukh"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    {/* Phone / WhatsApp */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Mobile / WhatsApp No. *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="e.g. 9822100001"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Course Package */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Select Course Package
                      </label>
                      <select
                        name="course_name"
                        value={formData.course_name}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-amber-500"
                      >
                        <option value="With License (26 Days Complete Package)">With License - 26 Days (Complete Package)</option>
                        <option value="Without License (26 Days Practical Road Training)">Without License - 26 Days (Practical Training)</option>
                        <option value="Only License (RTO Documentation & Prep)">Only License Prep & Test Assistance</option>
                      </select>
                    </div>

                    {/* Preferred Slot */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Preferred Training Slot
                      </label>
                      <select
                        name="preferred_time"
                        value={formData.preferred_time}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-amber-500"
                      >
                        <option value="Early Morning (6:00 AM - 8:00 AM)">Early Morning (6:00 AM - 8:00 AM)</option>
                        <option value="Morning (8:00 AM - 11:00 AM)">Morning (8:00 AM - 11:00 AM)</option>
                        <option value="Afternoon Ladies Batch (1:00 PM - 4:00 PM)">Afternoon Ladies Batch (1:00 PM - 4:00 PM)</option>
                        <option value="Evening (4:00 PM - 7:00 PM)">Evening (4:00 PM - 7:00 PM)</option>
                        <option value="Weekend Only (Sat & Sun)">Weekend Only (Sat & Sun)</option>
                      </select>
                    </div>
                  </div>

                  {/* Residential Address / Area (Zero Pickup Mentions) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Your Residential Area / Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="e.g. Shivaji Nagar, Jalna Road, Subhash Road, Shahu Nagar"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Notes / Questions */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Specific requirement or questions? (Optional)
                    </label>
                    <textarea
                      name="message"
                      rows={2}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="e.g. Need female instructor, want to start training from Monday..."
                      className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-slate-950" />
                        <span>Confirm Free Demo & Reserve Slot</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-6 text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      100% Privacy Protected
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                      Instant WhatsApp Confirmation
                    </span>
                  </div>

                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
