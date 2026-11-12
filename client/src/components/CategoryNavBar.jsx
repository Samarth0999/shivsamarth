import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, PanelLeftOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getNavSections } from '../utils/navConfig';

/**
 * Horizontal navigation bar divided into typed category menus when the sidebar is collapsed.
 */
export function CategoryNavBar() {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    toggleNavMenu,
    hasPermission
  } = useApp();

  const [openSectionId, setOpenSectionId] = useState(null);
  const barRef = useRef(null);

  const navSections = getNavSections({ currentUser, hasPermission });

  useEffect(() => {
    function handleClickOutside(event) {
      if (barRef.current && !barRef.current.contains(event.target)) {
        setOpenSectionId(null);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpenSectionId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <nav
      ref={barRef}
      aria-label="Primary category navigation"
      className="hidden sm:block bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-2 z-30"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {navSections.map((section, idx) => {
            const SectionIcon = section.icon;
            const activeItem = section.items.find(item => item.id === activeTab);
            const isSectionActive = Boolean(activeItem);
            const isSingleItem = section.items.length === 1;
            const singleItem = isSingleItem ? section.items[0] : null;
            const isOpen = openSectionId === section.id;

            return (
              <React.Fragment key={section.id}>
                {idx > 0 && (
                  <span className="h-4 w-px bg-slate-200 mx-0.5 hidden lg:inline-block" aria-hidden="true" />
                )}

                {isSingleItem ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(singleItem.id);
                      setOpenSectionId(null);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                      isSectionActive
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200/80'
                    }`}
                  >
                    <SectionIcon className={`w-3.5 h-3.5 shrink-0 ${isSectionActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{singleItem.shortLabel || singleItem.label}</span>
                  </button>
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenSectionId(prev => (prev === section.id ? null : section.id))}
                      aria-expanded={isOpen}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                        isSectionActive
                          ? 'bg-purple-50/90 text-purple-800 border-purple-200 shadow-2xs'
                          : isOpen
                            ? 'bg-slate-100 text-slate-900 border-slate-300'
                            : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200/80'
                      }`}
                    >
                      <SectionIcon className={`w-3.5 h-3.5 shrink-0 ${isSectionActive ? 'text-purple-600' : 'text-slate-500'}`} />
                      <span>{section.title}</span>
                      {activeItem && (
                        <span className="px-1.5 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-semibold leading-none">
                          {activeItem.shortLabel || activeItem.label}
                        </span>
                      )}
                      <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${
                        isSectionActive ? 'text-purple-500' : 'text-slate-400'
                      } ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50">
                        <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                          {section.title}
                        </div>

                        <div className="space-y-0.5">
                          {section.items.map((item) => {
                            const ItemIcon = item.icon;
                            const isActive = activeTab === item.id;

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setActiveTab(item.id);
                                  setOpenSectionId(null);
                                }}
                                className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer group ${
                                  isActive
                                    ? 'bg-purple-50 text-purple-900'
                                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                    isActive
                                      ? 'bg-purple-600 text-white'
                                      : 'bg-slate-100 text-slate-600 group-hover:bg-purple-100 group-hover:text-purple-600'
                                  }`}>
                                    <ItemIcon className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-xs truncate ${isActive ? 'font-bold text-purple-900' : 'font-semibold text-slate-800'}`}>
                                        {item.label}
                                      </span>
                                      {item.badge && (
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100/80 text-purple-800 font-semibold shrink-0">
                                          {item.badge}
                                        </span>
                                      )}
                                    </div>
                                    {item.description && (
                                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {isActive && (
                                  <Check className="w-4 h-4 text-purple-600 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <button
          type="button"
          onClick={toggleNavMenu}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="Expand Left Sidebar Navigation"
        >
          <PanelLeftOpen className="w-3.5 h-3.5" />
          <span>Sidebar</span>
        </button>
      </div>
    </nav>
  );
}

