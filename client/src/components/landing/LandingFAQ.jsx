import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Phone, MessageSquare } from 'lucide-react';

const faqs = [
  {
    q: 'What documents are required to register for Driving School & RTO License?',
    a: 'You only need 4 simple documents: 1) Aadhaar Card photocopy (with phone linked for OTP), 2) Proof of Age (Birth Certificate, School Leaving Certificate, or PAN Card), 3) 4 recent passport-size photographs, and 4) Blood Group report. Our staff handles all online uploads on the Sarathi Parivahan portal.'
  },
  {
    q: 'What is the minimum age to learn car driving in Maharashtra?',
    a: 'For Light Motor Vehicles (LMV - Cars), the statutory minimum age is 18 years completed. For non-geared two-wheelers (up to 50cc), you can apply at 16 years with parental consent.'
  },
  {
    q: 'What are the daily batch timings? Can I choose morning or evening?',
    a: 'We offer flexible 1-hour slots from 6:00 AM to 8:00 PM every day including weekends. Morning slots (6:00 AM – 9:00 AM) are popular with office goers and college students, while afternoon and evening slots (4:00 PM – 7:00 PM) fit businessmen and home makers.'
  },
  {
    q: 'What happens if I miss a class due to illness or urgent work? Do I lose my money?',
    a: 'Never! ShivSamarth operates under strict "Strategy A Absence Protection". Whenever you are marked absent, your course graduation date automatically extends by +1 day. You get every single hour of your 26 paid practical sessions guaranteed.'
  },
  {
    q: 'Do you offer lady instructors for female students in Beed?',
    a: 'Yes, absolutely! We have patient, certified female driving instructors who guide women with utmost safety and confidence in dedicated morning and afternoon batches.'
  },
  {
    q: 'Can I pay the training fees in installments?',
    a: 'Yes, absolutely! We offer flexible installment options via Cash or UPI (GPay/PhonePe). You can start your classes with an initial booking token, and the remaining fee can be settled comfortably in installments during your training.'
  },
  {
    q: 'What vehicles are used for practical driving lessons?',
    a: 'We maintain modern Maruti Suzuki Brezza (SUV) and Maruti Suzuki Swift (Hatchback) cars. All vehicles are fitted with government-inspected dual-pedal control units so our instructor can brake or clutch at any instant.'
  },
  {
    q: 'How long does it take to receive the Permanent Driving License (Smart Card)?',
    a: 'Once you complete your 26 days of training and clear the automated driving track test at Beed RTO (MH-23), the official smart card driving license is dispatched via India Post Speed Post to your residential address within 10 to 15 working days.'
  }
];

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 lg:py-24 bg-white text-slate-900 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-3">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Everything you need to know about course packages, RTO license requirements, flexible batches, and dual-control safety in Beed.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-white border-slate-300 shadow-sm'
                    : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-slate-900 focus:outline-none"
                >
                  <span className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                      isOpen ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {idx + 1}
                    </span>
                    <span>{faq.q}</span>
                  </span>
                  <div className={`p-1 rounded-md shrink-0 transition-transform ${
                    isOpen ? 'rotate-180 text-slate-900' : 'text-slate-400'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-fade-in pl-13 sm:pl-14">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions card */}
        <div className="mt-12 text-center p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200">
          <h3 className="font-bold text-slate-900 text-base sm:text-lg mb-1">Still have questions before enrolling?</h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-5 max-w-md mx-auto">
            Call our Shivaji Nagar, Beed counseling desk directly or send us a WhatsApp message.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="tel:+918507075555"
              className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span>Call +91 8507075555</span>
            </a>
            <a
              href="https://wa.me/918507075555?text=Hello%20ShivSamarth%20Driving%20School%2C%20I%20have%20a%20question%20regarding%20the%20admission%20process."
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask on WhatsApp</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
