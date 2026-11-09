import React from 'react';
import { ArrowRight, MapPin, ShieldCheck, Award, Star, CheckCircle2 } from 'lucide-react';

export function LandingHero({ onBookNow, onExploreCourses }) {
  return (
    <section id="home" className="relative bg-gradient-to-b from-slate-50 via-white to-slate-50/50 text-slate-900 pt-28 pb-16 sm:pt-32 sm:pb-20 lg:py-24 overflow-hidden border-b border-slate-200/60">
      
      {/* Subtle Ambient Light Gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-slate-100/60 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Trust Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Govt. Authorized Driving Academy • Beed (MH-23)</span>
            </div>

            {/* Main Heading - Clean, Balanced, Readable Typography */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.18]">
              Learn Driving <br />
              <span className="text-amber-600">With Full Confidence</span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 max-w-xl font-normal leading-relaxed">
              Official <strong>ShivSamarth Motor Driving School</strong> at Shivaji Nagar, Barshi Road, Beed. Master practical on-road driving on dual-pedal Maruti Suzuki Brezza & Swift training cars with patient, certified instructors and complete RTO Sarathi licensing guidance.
            </p>

            {/* Subtle, Light-Gray Outline Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-lg text-xs">
              <div className="flex items-center gap-2 rounded-lg bg-white border border-slate-200/80 px-3 py-2 text-slate-700 shadow-2xs">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-medium">Shivaji Nagar Track</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white border border-slate-200/80 px-3 py-2 text-slate-700 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">Dual-Control Fleet</span>
              </div>
              <div className="col-span-2 sm:col-span-1 flex items-center gap-2 rounded-lg bg-white border border-slate-200/80 px-3 py-2 text-slate-700 shadow-2xs">
                <Award className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-medium">100% RTO Assist</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={onBookNow}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-semibold text-sm shadow-sm transition-colors"
              >
                <span>Book Free Demo Slot</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreCourses}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-200 shadow-2xs transition-colors"
              >
                <span>Explore Training Packages</span>
              </button>
            </div>

            {/* Social Proof & Trust Metric Bar */}
            <div className="pt-3 border-t border-slate-200/60 flex flex-wrap items-center gap-5 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <span className="font-bold text-slate-800">4.9 / 5.0</span>
                <span>(480+ Google Reviews)</span>
              </div>
              <div className="hidden sm:block text-slate-300">•</div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">8,500+ Licensed in Beed</span>
              </div>
            </div>

          </div>

          {/* Right Column: Organic Clean Card with Fleet Photo */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-white border border-slate-200 p-2.5 shadow-xl transition-all">
              
              {/* Fleet Photo */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
                <img
                  src="/images/01.jpg"
                  alt="ShivSamarth Dual Control Fleet in Beed"
                  className="w-full h-full object-cover hover:scale-102 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = '/images/02.jpg';
                  }}
                />

                {/* Subtle Overlay Badge */}
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-md text-[11px] font-semibold text-slate-800 border border-slate-200/80 shadow-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dual Pedal Safety Setup</span>
                </div>

                <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-bold text-amber-300 shadow-xs">
                  MH-23 RTO Certified
                </div>
              </div>

              {/* Card Detail Bar */}
              <div className="p-3.5 pt-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Dual-Control Maruti Brezza & Swift
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official Shivaji Nagar Track & Highway Drills
                  </p>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  100% Pass Assist
                </span>
              </div>

            </div>
          </div>

        </div>
      </div>

    </section>
  );
}
