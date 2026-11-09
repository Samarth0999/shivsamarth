import React from 'react';
import { Star, Quote, CheckCircle2, ThumbsUp } from 'lucide-react';

const reviews = [
  {
    id: 1,
    name: 'Dr. Pooja Patil',
    role: 'Medical Practitioner, Beed',
    course: '26-Day With License Package',
    rating: 5,
    date: 'February 2026',
    comment: 'I was extremely nervous about driving in crowded Beed market areas. The instructor was extraordinarily calm and never raised his voice once. Cleared my RTO driving test on the very first try!',
    highlight: 'Cleared RTO on 1st Attempt'
  },
  {
    id: 2,
    name: 'Akshay Kulkarni',
    role: 'Software Engineer (WFH)',
    course: '26-Day Practical Road Training',
    rating: 5,
    date: 'January 2026',
    comment: 'The Maruti Brezza dual-control vehicle gave me immense confidence. We practiced slope balancing and highway overtaking on the Barshi road bypass. Best driving school in Beed district without a doubt.',
    highlight: 'Loved the Maruti Brezza'
  },
  {
    id: 3,
    name: 'Sneha Deshmukh',
    role: 'Teacher, Shivaji Nagar',
    course: 'Women Specialized Morning Batch',
    rating: 5,
    date: 'March 2026',
    comment: 'Special thanks for providing female instructor support! The 7:00 AM slot was so convenient before school hours. The reverse parking and H-track tips were spot on.',
    highlight: 'Lady Instructor Support'
  },
  {
    id: 4,
    name: 'Farhan Shaikh',
    role: 'Business Owner, Jalna Road',
    course: '26-Day With License VIP Package',
    rating: 5,
    date: 'December 2025',
    comment: 'Honest, dedicated training with zero hidden charges. Both city driving and RTO test were cleared smoothly without any stress at the RTO office.',
    highlight: 'Zero Hidden Charges'
  },
  {
    id: 5,
    name: 'Priya Chavan',
    role: 'Govt. Employee, Beed',
    course: '26-Day With License Package',
    rating: 5,
    date: 'January 2026',
    comment: 'Strategy A attendance flexibility was a lifesaver. When I had official election duty for 3 days, my course automatically extended by 3 days without losing any classes!',
    highlight: 'Flexible Attendance'
  },
  {
    id: 6,
    name: 'Rohan Shinde',
    role: 'Student, Dayanand College',
    course: 'Fast-Track License Package',
    rating: 5,
    date: 'February 2026',
    comment: 'Online Sarathi documentation, medical fitness certificate, and mock test were taken care of seamlessly. Got my smart card DL in 12 days!',
    highlight: 'RTO Smart Card in 12 Days'
  }
];

export function LandingTestimonials() {
  return (
    <section id="reviews" className="py-20 lg:py-24 bg-slate-50 border-y border-slate-200/60 text-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold mb-3 shadow-2xs">
            <ThumbsUp className="w-4 h-4 text-amber-600" />
            <span>Student Success Stories</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            Trusted by 8,500+ Confident Drivers in Beed
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Hear directly from graduates who overcame fear, learned defensive driving, and passed their MH-23 RTO tests on their first attempt.
          </p>

          {/* Social Proof Rating Pill */}
          <div className="mt-6 inline-flex items-center gap-4 bg-white border border-slate-200 px-5 py-2.5 rounded-xl shadow-2xs">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
              ))}
            </div>
            <div className="text-left border-l border-slate-200 pl-4">
              <span className="text-xs font-bold text-slate-900">4.9 / 5.0 Rating</span>
              <span className="text-xs text-slate-500 ml-1.5 hidden sm:inline">• 480+ Google Reviews in Beed</span>
            </div>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200"
            >
              <div>
                {/* Header with stars and quote */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-slate-300" />
                </div>

                {/* Highlight Pill */}
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-amber-900 font-semibold text-[11px] mb-3">
                  ✓ {rev.highlight}
                </div>

                {/* Comment */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  "{rev.comment}"
                </p>
              </div>

              {/* Author Info */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1">
                    <span>{rev.name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{rev.role}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{rev.date}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
