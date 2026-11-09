import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Sparkles, Send, Shield, Building2, Check } from 'lucide-react';

export function LandingBookingModal({ isOpen, onClose, initialCourse = null }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    branch_id: '1',
    course_name: 'With License (26 Days Complete Package)',
    preferred_time: 'Morning (7:00 AM - 9:00 AM)',
    address: 'Beed',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialCourse?.name) {
      setFormData(prev => ({ ...prev, course_name: initialCourse.name }));
    }
  }, [initialCourse]);

  if (!isOpen) return null;

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
          message: formData.notes,
          source: 'booking_modal'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit booking');
      }

      setSuccess(true);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-slate-900 max-h-[92vh] overflow-y-auto">

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {success ? (
          <div className="text-center py-6 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 font-bold shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">Trial Slot Reserved!</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-sm mx-auto">
              Thank you! Our supervisor at ShivSamarth Motor Driving School has received your request and will contact you via phone or WhatsApp shortly to confirm your demo timing.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <a
                href="https://wa.me/918507075555?text=Hi%20ShivSamarth%20Driving%20School%2C%20I%20just%20booked%20a%20demo%20slot%20online!"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <span>Chat on WhatsApp Directly</span>
              </a>
              <button
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Instant Trial Reservation</span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Book Your Free Demo Session</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Zero admission fee to start inquiry. Experience 1-on-1 driving on our dual-control Maruti Brezza.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Branch Selection Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Choose Training Branch *</span>
                </label>
                <select
                  name="branch_id"
                  value={formData.branch_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                >
                  <option value="1">1) ShivSamarth Main Branch (Swaraj Nagar, Beed) - +91 85070 75555</option>
                  <option value="2">2) ShriYash Branch (Sahayog Nagar, Beed) - +91 94206 35355</option>
                </select>
              </div>

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
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                />
              </div>

              {/* Mobile / WhatsApp Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="10-digit mobile number"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Course Package */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Course Package
                  </label>
                  <select
                    name="course_name"
                    value={formData.course_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="With License (26 Days Complete Package)">With License - 26 Days</option>
                    <option value="Without License (26 Days Practical Road Training)">Without License - 26 Days</option>
                    <option value="Only License (RTO Documentation & Prep)">Only License Assistance</option>
                  </select>
                </div>

                {/* Preferred Slot */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Preferred Time Slot
                  </label>
                  <select
                    name="preferred_time"
                    value={formData.preferred_time}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Early Morning (6:00 AM - 8:00 AM)">Early Morning (6:00 - 8:00 AM)</option>
                    <option value="Morning (8:00 AM - 11:00 AM)">Morning (8:00 - 11:00 AM)</option>
                    <option value="Afternoon (1:00 PM - 4:00 PM)">Afternoon Batch</option>
                    <option value="Evening (4:00 PM - 7:00 PM)">Evening (4:00 - 7:00 PM)</option>
                  </select>
                </div>
              </div>

              {/* Residential Area / Address (Zero Pickup Mentions) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Residential Area / Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. Shivaji Nagar, Subhash Road, Shahu Nagar"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                />
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Specific Query or Request (Optional)
                </label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="e.g. Prefer lady instructor, start this week..."
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 text-slate-950" />
                    <span>Confirm Free Demo & Reserve Slot</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-5 text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  100% Free Demo Session
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-600" />
                  No Advance Payment Required
                </span>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}
