import React from 'react';

export function Logo({ className = "h-10", iconOnly = false, lightText = false }) {
  return (
    <div className="flex items-center gap-3 select-none group">
      
      {/* Official Emblem Container */}
      <div className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl p-1 flex items-center justify-center transition-transform group-hover:scale-102 ${
        lightText 
          ? 'bg-slate-800 border border-slate-700 shadow-sm' 
          : 'bg-white border border-slate-200 shadow-xs'
      }`}>
        <img
          src="/images/IMG-20211120-WA0001-removebg-preview.png"
          alt="ShivSamarth Motor Driving School Emblem"
          className="w-full h-full object-contain"
          onError={(e) => {
            e.currentTarget.src = '/images/driving_school.png';
          }}
        />
      </div>

      {/* Brand Typography */}
      {!iconOnly && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-extrabold text-base sm:text-lg tracking-tight ${
              lightText ? 'text-white' : 'text-slate-900'
            }`}>
              ShivSamarth
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300/60 tracking-wider">
              MH-23
            </span>
          </div>
          <span className={`text-[11px] font-medium tracking-normal ${
            lightText ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Motor Driving School • Beed
          </span>
        </div>
      )}

    </div>
  );
}
