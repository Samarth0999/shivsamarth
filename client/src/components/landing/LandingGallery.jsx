import React, { useState } from 'react';
import { Camera, ZoomIn, ChevronLeft, ChevronRight, X, Shield, Award } from 'lucide-react';

const galleryItems = [
  {
    id: 1,
    title: 'Dual-Control Maruti Brezza & Swift Fleet',
    category: 'fleet',
    src: '/images/01.jpg',
    badge: 'Fleet',
    desc: 'Government RTO certified dual-control training cars for safe, accident-free learning.'
  },
  {
    id: 2,
    title: 'ShivSamarth Fleet Ready at Shivaji Nagar',
    category: 'fleet',
    src: '/images/02.jpg',
    badge: 'Fleet',
    desc: 'Serviced, sanitized, air-conditioned fleet dedicated to 1-on-1 practical driving.'
  },
  {
    id: 3,
    title: 'Dual Brake & Clutch Pedagogical Setup',
    category: 'tech',
    src: '/images/03.jpg',
    badge: 'Safety Tech',
    desc: 'Certified co-driver dual pedal system giving the instructor instantaneous safety control.'
  },
  {
    id: 4,
    title: 'On-Road City Traffic Driving Drills in Beed',
    category: 'practice',
    src: '/images/04.jpg',
    badge: 'On-Road',
    desc: 'Navigate crowded intersections, signal compliance, clutch biting points, and defensive steering.'
  },
  {
    id: 5,
    title: '1-on-1 Certified Instructor Guidance',
    category: 'students',
    src: '/images/05.jpg',
    badge: 'Training',
    desc: 'Patient, certified instructors guiding each student step-by-step through gear shifting.'
  },
  {
    id: 6,
    title: 'Reverse S-Bend & Parallel Parking Track',
    category: 'practice',
    src: '/images/06.jpg',
    badge: 'Track Prep',
    desc: 'Dedicated practice for the official RTO 8-track, H-track, and reverse parking exam.'
  },
  {
    id: 7,
    title: 'Campus & Training Ground at Barshi Road',
    category: 'fleet',
    src: '/images/07.jpg',
    badge: 'Campus',
    desc: 'Our primary branch at Barshi Road, Shivaji Nagar, Beed with dedicated training track.'
  },
  {
    id: 8,
    title: 'Dashboard Controls & Pre-Drive Inspection',
    category: 'students',
    src: '/images/08.jpg',
    badge: 'Students',
    desc: 'Learn mirror adjustment, blind spot checks, engine indicators, and pre-start routine.'
  },
  {
    id: 9,
    title: 'Dual Control Floor Rigging Inspection',
    category: 'tech',
    src: '/images/09.jpg',
    badge: 'Safety Tech',
    desc: 'Pedal linkages are mechanically inspected and certified before morning batches.'
  },
  {
    id: 10,
    title: 'Night & Twilight Driving Drills',
    category: 'practice',
    src: '/images/10.jpg',
    badge: 'On-Road',
    desc: 'Master headlight etiquette, night glare management, and highway lane discipline.'
  },
  {
    id: 11,
    title: 'Slope Incline & Flyover Balancing',
    category: 'practice',
    src: '/images/11.jpg',
    badge: 'Advanced',
    desc: 'Zero-rollback handbrake release and clutch friction point mastery on steep inclines.'
  },
  {
    id: 12,
    title: 'Highway Speed & Gear Optimization',
    category: 'practice',
    src: '/images/12.jpg',
    badge: 'Highway',
    desc: 'Safe overtaking, mirror indication, and cruise handling on Beed-Solapur bypass highway.'
  },
  {
    id: 13,
    title: 'Lady Instructors for Women Learners',
    category: 'students',
    src: '/images/13.jpg',
    badge: 'Women Batch',
    desc: 'Special morning and afternoon batches tailored for female learners with certified lady trainers.'
  },
  {
    id: 14,
    title: 'Graduation Day & Smart Card License Delivery',
    category: 'students',
    src: '/images/14.jpg',
    badge: 'Graduates',
    desc: 'Over 8,500+ successful drivers licensed with 100% first-attempt RTO pass assistance.'
  }
];

export function LandingGallery() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);

  const categories = [
    { id: 'all', label: 'All Photos' },
    { id: 'fleet', label: 'Training Fleet' },
    { id: 'practice', label: 'On-Road Practice' },
    { id: 'tech', label: 'Dual-Control Tech' },
    { id: 'students', label: 'Students & Trainers' }
  ];

  const filteredItems = activeCategory === 'all'
    ? galleryItems
    : galleryItems.filter(item => item.category === activeCategory);

  const handlePrev = (e) => {
    e?.stopPropagation();
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
  };

  return (
    <section id="gallery" className="py-20 lg:py-24 bg-white text-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-3">
            <Camera className="w-4 h-4 text-amber-600" />
            <span>Real Training Photos</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            Fleet, Facility & On-Road Training
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Take a look at our RTO-certified dual-control vehicles, certified instructors, track drills, and real driving sessions in Beed.
          </p>
        </div>

        {/* Filter Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSelectedPhotoIndex(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => setSelectedPhotoIndex(index)}
              className="group relative rounded-xl overflow-hidden bg-white border border-slate-200 shadow-2xs cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-200"
            >
              {/* Image */}
              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                <img
                  src={item.src}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = '/images/driving_school.png';
                  }}
                />
                
                {/* Subtle Hover Icon */}
                <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-md">
                    <ZoomIn className="w-5 h-5" />
                  </div>
                </div>

                {/* Badge */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/95 text-slate-800 border border-slate-200 shadow-2xs">
                    {item.badge}
                  </span>
                </div>
              </div>

              {/* Caption */}
              <div className="p-3.5">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-amber-600 transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Highlight Banner below gallery */}
        <div className="mt-14 bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-2xs">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Govt. RTO Certified Training Fleet</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Every vehicle holds valid RTO dual-control inspection fitness, commercial permit, and full insurance.
              </p>
            </div>
          </div>
          <a
            href="#contact"
            className="shrink-0 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition-colors"
          >
            Visit Our Shivaji Nagar Track
          </a>
        </div>

      </div>

      {/* Lightbox Modal */}
      {selectedPhotoIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-slate-900">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900">
                  {filteredItems[selectedPhotoIndex].badge}
                </span>
                <span className="text-xs text-slate-500">
                  {selectedPhotoIndex + 1} of {filteredItems.length}
                </span>
              </div>
              <button
                onClick={() => setSelectedPhotoIndex(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Image */}
            <div className="relative aspect-[16/10] bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={filteredItems[selectedPhotoIndex].src}
                alt={filteredItems[selectedPhotoIndex].title}
                className="w-full h-full object-contain"
              />

              {/* Prev / Next controls */}
              <button
                onClick={handlePrev}
                className="absolute left-3 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center transition-all shadow-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center transition-all shadow-md"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Caption Footer */}
            <div className="p-4 bg-white border-t border-slate-100">
              <h4 className="font-bold text-sm sm:text-base text-slate-900">
                {filteredItems[selectedPhotoIndex].title}
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                {filteredItems[selectedPhotoIndex].desc}
              </p>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
