import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CheckCircle, XCircle, MapPin, Calendar, Clock, 
  MessageSquare, AlertTriangle, ShieldCheck, Wallet, 
  Navigation, RefreshCw, UserCheck, AlertCircle,
  ClipboardList, Star
} from 'lucide-react';

export function InstructorView() {
  const { 
    currentUser, 
    apiFetch, 
    showToast, 
    triggerWhatsAppReminder,
    triggerGoogleReviewRequest,
    settings,
    activeTab,
    setActiveTab 
  } = useApp();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [roster, setRoster] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [loadingRoster, setLoadingRoster] = useState(true);

  // Geofence Check-in state
  const [geoStatus, setGeoStatus] = useState(null);
  const [currentGps, setCurrentGps] = useState(null);
  const [checkingGps, setCheckingGps] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Personal wage & history state
  const [wageHistory, setWageHistory] = useState([]);
  const [day10List, setDay10List] = useState([]);

  // Fetch Roster
  const fetchRoster = async () => {
    setLoadingRoster(true);
    try {
      let url = `/api/attendance/students/roster?date=${date}`;
      if (selectedBatchId) url += `&batch_id=${selectedBatchId}`;

      const res = await apiFetch(url);
      if (res.roster) setRoster(res.roster);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRoster(false);
    }
  };

  // Fetch Batches
  const fetchBatches = async () => {
    try {
      const res = await apiFetch('/api/batches');
      if (res.batches) {
        setBatches(res.batches);
        if (res.batches.length > 0 && !selectedBatchId) {
          setSelectedBatchId(res.batches[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Geofence Status
  const fetchGeofenceStatus = async () => {
    try {
      const res = await apiFetch('/api/attendance/staff/today');
      setGeoStatus(res);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Wage History
  const fetchWageHistory = async () => {
    try {
      const res = await apiFetch('/api/attendance/staff/history');
      if (res.history) setWageHistory(res.history);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Day 10 Reminders for Instructor's Branch
  const fetchDay10Reminders = async () => {
    try {
      const res = await apiFetch('/api/students?day10Only=true');
      if (res.students) setDay10List(res.students);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchGeofenceStatus();
    fetchWageHistory();
    fetchDay10Reminders();
  }, []);

  useEffect(() => {
    fetchRoster();
  }, [date, selectedBatchId]);

  // Mark Student Attendance with Strategy A Engine
  const handleMarkAttendance = async (studentId, status) => {
    try {
      const res = await apiFetch('/api/attendance/students/mark', {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId,
          date,
          status
        })
      });

      showToast(res.message);
      fetchRoster();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Dispatch Google Review WhatsApp message
  const handleSendGoogleReview = async (student) => {
    await triggerGoogleReviewRequest(student);
    setRoster(prev => prev.map(s => s.id === student.id ? { ...s, last_review_request_at: new Date().toISOString() } : s));
  };

  // Live GPS Capture & Check-In
  const handleGeofencedCheckIn = () => {
    setCheckingGps(true);
    setGeoError('');

    const proceedCheckin = async (latitude, longitude) => {
      try {
        const res = await apiFetch('/api/attendance/staff/checkin', {
          method: 'POST',
          body: JSON.stringify({ latitude, longitude })
        });
        showToast(res.message);
        fetchGeofenceStatus();
        fetchWageHistory();
      } catch (err) {
        setGeoError(err.message);
        showToast(err.message, 'error');
      } finally {
        setCheckingGps(false);
      }
    };

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setCheckingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentGps({ lat: latitude, lon: longitude });
        proceedCheckin(latitude, longitude);
      },
      (err) => {
        setGeoError(`Unable to retrieve GPS: ${err.message}. Please enable location permissions and try again.`);
        setCheckingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Staff Check-Out
  const handleCheckOut = async () => {
    try {
      const res = await apiFetch('/api/attendance/staff/checkout', { method: 'POST' });
      showToast(res.message);
      fetchGeofenceStatus();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Current view tab for Instructor
  const subTab = activeTab.startsWith('instructor-') ? activeTab.replace('instructor-', '') : 'roster';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Instructor Workspace Header */}
      <div className="bg-gradient-to-br from-[#140d21] via-[#1c1230] to-[#281647] p-5 sm:p-6 rounded-2xl text-white shadow-lg border border-purple-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 font-bold uppercase tracking-wider border border-purple-400/30">
                Instructor Workspace
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {currentUser?.branch_name || 'Main Branch'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-2">{currentUser?.name}</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Compensation: <span className="font-semibold text-white capitalize">{currentUser?.salary_type}</span> · Base ₹{Number(currentUser?.base_salary || 0).toLocaleString('en-IN')}
            </p>
          </div>

          {/* Quick Check-in / Check-out pill */}
          <div className="bg-white/10 backdrop-blur-xs px-4 py-3 rounded-xl border border-white/10 flex items-center gap-3 self-start sm:self-auto">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              geoStatus?.attendance?.check_out_time
                ? 'bg-purple-400'
                : geoStatus?.attendance?.check_in_time
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400'
            }`} />
            <div>
              <div className="text-[10px] text-slate-300 uppercase font-semibold tracking-wider">Today&apos;s Attendance</div>
              <div className="text-xs font-bold text-white">
                {geoStatus?.attendance?.check_out_time
                  ? `In ${geoStatus.attendance.check_in_time} · Out ${geoStatus.attendance.check_out_time}`
                  : geoStatus?.attendance?.check_in_time
                    ? `Checked in at ${geoStatus.attendance.check_in_time}`
                    : 'Not Checked In Yet'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs for Instructor */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-white/10 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('instructor')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'instructor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Attendance Roster</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('instructor-checkin')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'instructor-checkin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>GPS Check-In</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('instructor-wages')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'instructor-wages' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>My Wages &amp; Logs</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('instructor-reminders')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'instructor-reminders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Day 10 Alerts ({day10List.length})</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. STUDENT BATCH ATTENDANCE & STRATEGY A ROSTER (Module 6) */}
      {/* ============================================================== */}
      {activeTab === 'instructor' && (
        <div className="space-y-4">
          
          {/* Controls: Date Picker & Batch Slot */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent focus:outline-none text-slate-800"
                />
              </div>

              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Batch Slots</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.time_slot})
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Strategy A Rule: <strong className="text-slate-700">Absent = End Date +1 Day</strong>
            </div>
          </div>

          {/* Student Roster Cards */}
          <div className="space-y-3">
            {roster.map(student => {
              const isPresent = student.attendance_status === 'present';
              const isAbsent = student.attendance_status === 'absent';
              const triggerDays = Number(settings?.google_review_trigger_days) || 3;
              const remainingDays = (student.total_course_days || 0) - (student.days_completed || 0);
              const isReviewReady = student.isNearingCompletion || (student.total_course_days > 0 && remainingDays <= triggerDays) || (student.days_completed >= student.total_course_days);

              return (
                <div 
                  key={student.id} 
                  className={`bg-white p-4 rounded-2xl border transition-all shadow-xs ${
                    isPresent ? 'border-emerald-300 bg-emerald-50/20' :
                    isAbsent ? 'border-rose-300 bg-rose-50/20' :
                    'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {student.enroll_id}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {student.batch_time_slot}
                        </span>
                        {isReviewReady && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                            Review Ready
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 mt-1">{student.name}</h4>
                      <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                        <span>Training: <strong className="text-slate-800">Day {student.days_completed}/{student.total_course_days}</strong></span>
                        <span>•</span>
                        <span>Graduation: <strong className="font-mono text-slate-700">{student.expected_end_date}</strong></span>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {isReviewReady && (
                        <button
                          type="button"
                          onClick={() => handleSendGoogleReview(student)}
                          title={student.last_review_request_at ? `Google Review asked on ${new Date(student.last_review_request_at).toLocaleDateString()}` : 'Send 5-Star Google Review WhatsApp invite'}
                          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                            student.last_review_request_at
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border-amber-400 shadow-xs'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${student.last_review_request_at ? 'fill-amber-500 text-amber-600' : 'fill-white text-white'}`} />
                          <span>{student.last_review_request_at ? 'Resend Review' : 'Ask Review'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleMarkAttendance(student.id, 'present')}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                          isPresent 
                            ? 'bg-emerald-600 text-white shadow-emerald-500/25 scale-102 ring-2 ring-emerald-400' 
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Present</span>
                      </button>

                      <button
                        onClick={() => handleMarkAttendance(student.id, 'absent')}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                          isAbsent 
                            ? 'bg-rose-600 text-white shadow-rose-500/25 scale-102 ring-2 ring-rose-400' 
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Absent (+1 Day)</span>
                      </button>
                    </div>

                  </div>

                  {/* Feedback line if marked absent */}
                  {isAbsent && (
                    <div className="mt-2.5 pt-2 border-t border-rose-100 text-[11px] text-rose-700 font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Strategy A applied: Training graduation date automatically extended to {student.expected_end_date}.</span>
                    </div>
                  )}
                </div>
              );
            })}

            {roster.length === 0 && !loadingRoster && (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
                No active students found for this batch slot.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 2. GPS GEOFENCED STAFF CHECK-IN (Module 8) */}
      {/* ============================================================== */}
      {activeTab === 'instructor-checkin' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span>GPS Geofenced Attendance Station</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                System validates live coordinates against branch location using the Haversine formula (100m radius limit).
              </p>
            </div>
          </div>

          {/* Branch Target Location Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Assigned Physical Branch</span>
              <div className="font-bold text-sm text-slate-800 mt-0.5">{geoStatus?.branch?.name}</div>
              <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                GPS: {geoStatus?.branch?.latitude}, {geoStatus?.branch?.longitude}
              </div>
            </div>

            <div className="text-right">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Geofence Radius</span>
              <div className="font-bold text-sm text-blue-700 mt-0.5">
                Within {geoStatus?.maxRadiusMeters || 100} meters
              </div>
            </div>
          </div>

          {/* Today's Status Banner */}
          {geoStatus?.attendance?.check_in_time ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Checked In & Geofence Verified</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Check-in time: <strong>{geoStatus.attendance.check_in_time}</strong> • Distance from branch: <strong>{geoStatus.attendance.distance_meters}m</strong>
                  </p>
                </div>
              </div>

              {!geoStatus.attendance.check_out_time ? (
                <button
                  type="button"
                  onClick={handleCheckOut}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Record Check-Out
                </button>
              ) : (
                <span className="text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  Checked out at <strong>{geoStatus.attendance.check_out_time}</strong>
                </span>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950">
              <h4 className="font-bold text-sm">Check-In Required</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Please check in when you arrive at your driving school branch location.
              </p>
            </div>
          )}

          {/* Live Check-In Action Button */}
          {!geoStatus?.attendance?.check_in_time && (
            <button
              type="button"
              onClick={handleGeofencedCheckIn}
              disabled={checkingGps}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Navigation className="w-4 h-4" />
              <span>{checkingGps ? 'Validating Live GPS Distance...' : 'Check In via Live GPS (100m Radius)'}</span>
            </button>
          )}

          {geoError && (
            <div className="p-3 bg-rose-50 text-rose-800 text-xs font-medium rounded-xl border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{geoError}</span>
            </div>
          )}

        </div>
      )}

      {/* ============================================================== */}
      {/* 3. INSTRUCTOR WAGE & ATTENDANCE HISTORY (Module 8) */}
      {/* ============================================================== */}
      {activeTab === 'instructor-wages' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <span>My Attendance & Wage Tracker</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated monthly salary and daily wage calculations based on verified attendance records.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-400 font-bold uppercase">Wage Configuration</span>
              <div className="text-base font-black text-slate-900 mt-1 capitalize">
                {currentUser?.salary_type === 'daily' ? `₹${currentUser?.base_salary} / Day` : `₹${currentUser?.base_salary} / Month`}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-400 font-bold uppercase">Days Present Logged</span>
              <div className="text-base font-black text-blue-600 mt-1">
                {wageHistory.length} Days Recorded
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-400 font-bold uppercase">Calculated Gross (Attended)</span>
              <div className="text-base font-black text-emerald-600 mt-1">
                {currentUser?.salary_type === 'daily' 
                  ? `₹${wageHistory.length * currentUser?.base_salary}` 
                  : `₹${Math.round((currentUser?.base_salary / 30) * wageHistory.length)}`}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Paid Sundays added in monthly payroll</div>
            </div>
          </div>

          {/* History Table */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Recent Attendance Log</h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="md:hidden divide-y divide-slate-100">
                {wageHistory.map(row => (
                  <div key={row.id} className="p-3.5 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="font-mono font-bold text-slate-800">{row.date}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                        In: {row.check_in_time || '-'} · Out: {row.check_out_time || '-'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        Verified
                      </span>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {row.distance_meters ? `${row.distance_meters}m` : '-'}
                      </div>
                    </div>
                  </div>
                ))}
                {wageHistory.length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-400">No attendance history logged yet.</div>
                )}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Check-In</th>
                      <th className="py-2.5 px-3">Check-Out</th>
                      <th className="py-2.5 px-3">Distance</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {wageHistory.map(row => (
                      <tr key={row.id}>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{row.date}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono">{row.check_in_time || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono">{row.check_out_time || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{row.distance_meters ? `${row.distance_meters}m` : '-'}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                            Verified Present
                          </span>
                        </td>
                      </tr>
                    ))}
                    {wageHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">No attendance history logged yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 4. DAY 10 SOFT WARNINGS & WHATSAPP TRIGGERS (Module 7) */}
      {/* ============================================================== */}
      {activeTab === 'instructor-reminders' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Day 10 Soft Warning Dashboard</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Students reaching Day 10 of training with an unpaid course balance. Trigger WhatsApp reminders with 1 click.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {day10List.map(student => (
              <div key={student.id} className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      {student.enroll_id}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      Day {student.days_completed}/{student.total_course_days}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-1">{student.name}</h4>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Phone: <strong className="text-slate-700">{student.phone}</strong> • Pending: <strong className="text-rose-600 font-mono">₹{student.pending_balance}</strong>
                  </div>
                </div>

                <button
                  onClick={() => triggerWhatsAppReminder(student)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send WhatsApp Fee Reminder</span>
                </button>
              </div>
            ))}

            {day10List.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No students currently pending at the Day 10 threshold.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
