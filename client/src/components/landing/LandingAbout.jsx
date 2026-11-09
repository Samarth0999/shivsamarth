import React from 'react';
import { ShieldCheck, UserCheck, Clock, Award, CheckCircle2, MapPin } from 'lucide-react';

export function LandingAbout() {
  const features = [
    {
      title: 'Dual-Control Certified Fleet',
      desc: 'All training cars feature secondary dual-clutch and dual-brake control operated by your certified instructor for 100% peace of mind.'
    },
    {
      title: '1-on-1 Instructor Continuity',
      desc: 'You train permanently with the same patient, primary certified instructor throughout your 26 days of practical driving lessons.'
    },
    {
      title: 'Computerized RTO Exam Prep',
      desc: 'Comprehensive guidance on traffic sign rules, lane discipline, and complete assistance with Learner’s & Permanent Driving License tests.'
    },
    {
      title: 'Flexible Morning & Evening Shifts',
      desc: 'Convenient 1-hour batch slots operating from 6:00 AM to 8:00 PM to fit college, office, business, and homemaker schedules.'
    }
  ];

  return (
    <section id="about" className="py-20 lg:py-24 bg-white text-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Real Photos Collage */}
          <div className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-3.5">
              
              <div className="space-y-3.5">
                <div className="rounded-2xl overflow-hidden aspect-[4/5] shadow-md border border-slate-200 bg-slate-100">
                  <img
                    src="/images/07.jpg"
                    alt="ShivSamarth Instructor Training Session"
                    className="w-full h-full object-cover hover:scale-103 transition-transform duration-500"
                    onError={(e) => { e.currentTarget.src = '/images/05.jpg'; }}
                  />
                </div>
                <div className="p-4 rounded-xl bg-amber-500 text-slate-950 text-center shadow-xs">
                  <div className="text-2xl font-black">15+ Years</div>
                  <div className="text-xs font-semibold uppercase tracking-wider">Trusted in Beed</div>
                </div>
              </div>

              <div className="space-y-3.5 pt-5">
                <div className="p-4 rounded-xl bg-slate-900 text-white shadow-xs">
                  <div className="text-2xl font-black text-amber-400">12,000+</div>
                  <div className="text-xs text-slate-300 font-medium">Licensed Graduates</div>
                </div>
                <div className="rounded-2xl overflow-hidden aspect-[4/5] shadow-md border border-slate-200 bg-slate-100">
                  <img
                    src="/images/05.jpg"
                    alt="ShivSamarth Practical Driving Drill"
                    className="w-full h-full object-cover hover:scale-103 transition-transform duration-500"
                    onError={(e) => { e.currentTarget.src = '/images/01.jpg'; }}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Mission & Features */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>About ShivSamarth Motor Driving School</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Building Safe, Confident Drivers in Beed for Over 15 Years
            </h2>

            <p className="text-base text-slate-600 leading-relaxed font-normal">
              Located opposite the Shivaji Statue at <strong>Shivaji Nagar, Barshi Road, Beed</strong>, ShivSamarth Motor Driving School is the premier driving training academy in Marathwada. We combine disciplined traffic education with practical on-road experience on highways, city bottlenecks, parking maneuvers, and night driving.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {features.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{item.title}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs text-slate-600 font-medium bg-slate-50 border border-slate-200/80 p-3 rounded-lg">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Main Branch: Satyabhama Complex, Swaraj Nagar | Branch 2: Sahayog Nagar, Beed</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
