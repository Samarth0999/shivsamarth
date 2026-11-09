import React from 'react';
import { Check, Award, ArrowRight, Clock } from 'lucide-react';

export function LandingCourses({ onEnroll }) {
  const packages = [
    {
      id: 'course-1',
      name: 'Without License (Practical Road Training)',
      duration: '26 Days (Daily 1 Hr)',
      badge: 'Refresher & Practice',
      popular: false,
      desc: 'Ideal for learners who already hold a valid driving license and want 26 days of confident behind-the-wheel city and highway driving practice.',
      features: [
        '26 on-road practical driving sessions',
        'Steering control, clutch balance & brake reflex',
        'Bumper-to-bumper city traffic handling',
        'Reverse, parallel & slope ramp parking',
        'Dedicated Shivaji Nagar track practice & highway drills'
      ]
    },
    {
      id: 'course-2',
      name: 'With License (Complete Package)',
      duration: '26 Days (Daily 1 Hr)',
      badge: 'Most Popular',
      popular: true,
      desc: 'Comprehensive end-to-end package for absolute beginners. Includes 26 days of on-road training plus full government RTO licensing assistance.',
      features: [
        'Complete 26-day on-road practical driving training',
        'Government RTO License Assistance (LL + DL)',
        'RTO computerized test prep & mock tests',
        'Dual-control Maruti Brezza / Swift training cars',
        'Authorized RTO track practice & test accompaniment',
        'Shivaji Nagar training ground & official RTO exam drills'
      ]
    },
    {
      id: 'course-3',
      name: 'Only License (RTO Assistance)',
      duration: '1–2 Days Test Prep',
      badge: 'Fast-Track',
      popular: false,
      desc: 'For experienced drivers who already know how to drive and require legal documentation, medical fitness form, and RTO test scheduling assistance.',
      features: [
        'Sarathi Parivahan RTO online documentation',
        'Medical fitness certificate assistance',
        'Learner’s & Permanent test appointment slotting',
        'Pre-test vehicle drill on official RTO track',
        '100% test clearance guidance'
      ]
    }
  ];

  return (
    <section id="courses" className="py-20 lg:py-24 bg-slate-50 border-y border-slate-200/60 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Structured Training Packages</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Professional Training Packages • RTO Certified
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Choose the package tailored to your driving readiness. Every training session is backed by certified instructors, dual-pedal safety vehicles, and easy installment options in Beed.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 relative ${
                pkg.popular
                  ? 'bg-white border-2 border-slate-900 shadow-lg scale-101'
                  : 'bg-white border border-slate-200 shadow-2xs hover:border-slate-300'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm">
                  ★ Most Popular Choice
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                    pkg.popular ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {pkg.badge}
                  </span>
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{pkg.duration}</span>
                  </span>
                </div>

                <h3 className="text-lg font-bold mt-4 text-slate-900">
                  {pkg.name}
                </h3>
                <p className="text-xs sm:text-sm mt-2 leading-relaxed text-slate-600 font-normal">
                  {pkg.desc}
                </p>

                <div className="mt-5 pb-5 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Flexible Installments
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-slate-100 text-slate-700">
                      Quote on Request
                    </span>
                  </div>
                  <p className="text-xs mt-1 text-slate-500">
                    Transparent fee • Free trial session included
                  </p>
                </div>

                <ul className="mt-5 space-y-2.5 text-xs sm:text-sm">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-7 pt-5 border-t border-slate-100">
                <button
                  onClick={() => onEnroll(pkg)}
                  className={`w-full py-3 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors ${
                    pkg.popular
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <span>Enquire & Book Demo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
