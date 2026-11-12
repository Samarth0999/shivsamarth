import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen, Plus, Edit, Trash2, Clock, Award,
  CheckCircle2, X, IndianRupee
} from 'lucide-react';

export function CoursesView() {
  const { courseTypes, isSuperAdmin, apiFetch, showToast, loadInitialData, currentUser } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState({
    name: '',
    duration_days: 26,
    base_fee: 7000,
    is_license_course: 1,
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingCourse(null);
    setForm({
      name: '',
      duration_days: 26,
      base_fee: 7000,
      is_license_course: 1,
      description: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setForm({
      name: course.name,
      duration_days: course.duration_days,
      base_fee: course.base_fee,
      is_license_course: course.is_license_course ? 1 : 0,
      description: course.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Course package name is required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCourse) {
        await apiFetch(`/api/settings/course-types/${editingCourse.id}`, {
          method: 'PUT',
          body: JSON.stringify(form)
        });
        showToast('Course package updated successfully!');
      } else {
        await apiFetch('/api/settings/course-types', {
          method: 'POST',
          body: JSON.stringify(form)
        });
        showToast('Course package created successfully!');
      }
      setIsModalOpen(false);
      await loadInitialData(currentUser?.id);
    } catch (err) {
      showToast(err.message || 'Failed to save course', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (course) => {
    try {
      await apiFetch(`/api/settings/course-types/${course.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: course.is_active ? 0 : 1 })
      });
      showToast(`Course marked ${course.is_active ? 'inactive' : 'active'}`);
      await loadInitialData(currentUser?.id);
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleDeleteCourse = async (course) => {
    try {
      const res = await apiFetch(`/api/settings/course-types/${course.id}`, {
        method: 'DELETE'
      });
      showToast(res.message || 'Course updated');
      await loadInitialData(currentUser?.id);
    } catch (err) {
      showToast(err.message || 'Failed to remove course', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-purple-600" />
            <span>Dynamic Course Catalog</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure training programs, standard base fees, and RTO licensing packages.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm shadow-purple-600/20 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course Package</span>
          </button>
        )}
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(courseTypes || []).map((course) => (
          <div
            key={course.id}
            className={`bg-white rounded-2xl border p-6 shadow-2xs flex flex-col justify-between transition-all ${
              course.is_active ? 'border-slate-200/80 hover:border-purple-200' : 'border-slate-200/60 opacity-65'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {Boolean(course.is_license_course) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-semibold">
                      <Award className="w-3 h-3" />
                      RTO License
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    course.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {course.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {course.name}
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed min-h-[36px]">
                {course.description || 'Standard practical driving & RTO documentation package.'}
              </p>

              <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-100">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <IndianRupee className="w-3 h-3" /> Standard Fee
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    ₹{Number(course.base_fee || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Training Duration
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {course.duration_days} Days
                  </div>
                </div>
              </div>
            </div>

            {isSuperAdmin && (
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleActive(course)}
                  className="text-xs font-semibold text-slate-600 hover:text-purple-700 cursor-pointer"
                >
                  {course.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(course)}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-purple-700 transition-colors cursor-pointer"
                    title="Edit Course"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCourse(course)}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete or Archive Course"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add / Edit Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingCourse ? 'Edit Course Package' : 'New Course Package'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Course Title</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Car 4-Wheeler Training (26 Days) + DL"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.duration_days}
                    onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Standard Base Fee (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.base_fee}
                    onChange={(e) => setForm({ ...form, base_fee: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.is_license_course)}
                  onChange={(e) => setForm({ ...form, is_license_course: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 accent-purple-600 rounded"
                />
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  Includes RTO Learner / Driving License Processing
                </span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Program Description</label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe training sessions, dual-control practice, and RTO inclusions..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : 'Save Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

