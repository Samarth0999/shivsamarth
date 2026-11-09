import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CheckCircle, XCircle, Calendar, Clock, MapPin, 
  ShieldCheck, AlertTriangle, Users, Navigation, UserCheck
} from 'lucide-react';

export function AttendanceView() {
  const { currentUser, selectedBranchId, apiFetch, showToast } = useApp();

  const [activeTab, setActiveTab] = useState('student-att'); // 'student-att' | 'staff-att'
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);

  // Staff geofence state
  const [geoStatus, setGeoStatus] = useState(null);
  const [checkingGps, setCheckingGps] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Load batches & staff geofence status
  useEffect(() => {
    async function loadInitial() {
      try {
        const bRes = await apiFetch(`/api/batches${selectedBranchId ? `?branchId=${selectedBranchId}` : ''}`);
        if (bRes.batches) {
          setBatches(bRes.batches);
          if (bRes.batches.length > 0 && !selectedBatchId) {
            setSelectedBatchId(bRes.batches[0].id);
          }
        }

        const geoRes = await apiFetch('/api/attendance/staff/today');
        setGeoStatus(geoRes);
      } catch (e) {
        console.error(e);
      }
    }
    loadInitial();
  }, [selectedBranchId]);

  // Load student roster for attendance
  const fetchRoster = async () => {
    setLoading(true);
    try {
      let url = `/api/attendance/students/roster?date=${date}`;
      if (selectedBatchId) url += `&batch_id=${selectedBatchId}`;

      const res = await apiFetch(url);
      if (res.roster) setRoster(res.roster);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [date, selectedBatchId]);

  // Mark student attendance (Strategy A Engine)
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

  // Staff Geofenced Check-In
  const handleGeofencedCheckIn = (lat, lon) => {
    setCheckingGps(true);
    setGeoError('');

    const proceedCheckin = async (latitude, longitude) => {
      try {
        const res = await apiFetch('/api/attendance/staff/checkin', {
          method: 'POST',
          body: JSON.stringify({ latitude, longitude })
        });
        showToast(res.message);
        const geoRes = await apiFetch('/api/attendance/staff/today');
        setGeoStatus(geoRes);
      } catch (err) {
        setGeoError(err.message);
        showToast(err.message, 'error');
      } finally {
        setCheckingGps(false);
      }
    };

    if (lat !== undefined && lon !== undefined) {
      proceedCheckin(lat, lon);
      return;
    }

    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by browser.');
      setCheckingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => proceedCheckin(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        setGeoError(`Unable to retrieve GPS: ${err.message}. Use simulation below.`);
        setCheckingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Attendance & Strategy A Absence Engine</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              Strategy A Active
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Module 6: Single-click student present/absent toggling with automatic graduation calendar extension, plus geofenced staff check-in.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('student-att')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'student-att' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Student Batch Roster</span>
          </button>
          <button
            onClick={() => setActiveTab('staff-att')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'staff-att' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Staff Geofenced Station</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: STUDENT BATCH ATTENDANCE & STRATEGY A ENGINE */}
      {/* ============================================================== */}
      {activeTab === 'student-att' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
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
                  <option key={b.id} value={b.id}>{b.name} ({b.time_slot})</option>
                ))}
              </select>
            </div>

            {/* Strategy A Rule Reminder Banner */}
            <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>Strategy A: <strong>Present (+1 day completed)</strong> | <strong>Absent (+1 day graduation extension)</strong></span>
            </div>
          </div>

          {/* Student Attendance Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student & Enroll ID</th>
                  <th className="py-3 px-3">Batch Slot</th>
                  <th className="py-3 px-3">Days Done</th>
                  <th className="py-3 px-3">Calculated Graduation End Date</th>
                  <th className="py-3 px-3">Today's Status</th>
                  <th className="py-3 px-4 text-right">Attendance Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roster.map(student => {
                  const isPresent = student.attendance_status === 'present';
                  const isAbsent = student.attendance_status === 'absent';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{student.name}</div>
                        <div className="text-[11px] font-mono text-blue-700 font-bold mt-0.5">{student.enroll_id}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{student.batch_time_slot || 'Unassigned'}</div>
                        <div className="text-[11px] text-slate-400">{student.branch_name}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-black text-slate-900 text-sm">
                          {student.days_completed}/{student.total_course_days}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-800">{student.expected_end_date}</div>
                        <div className="text-[10px] text-slate-400">Strategy A auto-extended if absent</div>
                      </td>

                      <td className="py-3 px-3">
                        {isPresent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Present
                          </span>
                        )}
                        {isAbsent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200">
                            Absent (+1 Day)
                          </span>
                        )}
                        {!isPresent && !isAbsent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-500">
                            Not Marked
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleMarkAttendance(student.id, 'present')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isPresent
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Present</span>
                          </button>

                          <button
                            onClick={() => handleMarkAttendance(student.id, 'absent')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isAbsent
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Absent</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: GEOFENCED STAFF ATTENDANCE STATION */}
      {/* ============================================================== */}
      {activeTab === 'staff-att' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span>Geofenced Staff Check-In Station</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Live GPS verification against branch center coordinates using the Haversine great-circle distance algorithm.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Your Assigned Physical Branch</span>
              <div className="font-bold text-sm text-slate-900 mt-1">{geoStatus?.branch?.name}</div>
              <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                Target Coordinates: {geoStatus?.branch?.latitude}, {geoStatus?.branch?.longitude}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Configured Geofence Radius</span>
              <div className="font-bold text-sm text-blue-700 mt-1">Within {geoStatus?.maxRadiusMeters || 100} meters</div>
              <div className="text-slate-500 text-[11px] mt-0.5">Check-in blocked beyond this perimeter</div>
            </div>
          </div>

          {/* Verification Status */}
          {geoStatus?.attendance?.check_in_time ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-emerald-950">Checked In & Geofence Verified</h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Check-in recorded at <strong>{geoStatus.attendance.check_in_time}</strong> ({geoStatus.attendance.distance_meters}m from branch).
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => handleGeofencedCheckIn()}
                disabled={checkingGps}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                <span>{checkingGps ? 'Calculating Live GPS Distance...' : 'Check In via Live GPS (100m Perimeter)'}</span>
              </button>

              {/* Simulation test triggers */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-1">🧪 Test Controls: Device GPS Simulation</div>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <button
                    onClick={() => handleGeofencedCheckIn(geoStatus?.branch?.latitude + 0.0001, geoStatus?.branch?.longitude + 0.0001)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                  >
                    Simulate: At Branch (20m away) ✅
                  </button>
                  <button
                    onClick={() => handleGeofencedCheckIn(geoStatus?.branch?.latitude + 0.02, geoStatus?.branch?.longitude + 0.02)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                  >
                    Simulate: Offsite (2.2km away) ❌
                  </button>
                </div>
              </div>
            </div>
          )}

          {geoError && (
            <div className="p-3 bg-rose-50 text-rose-800 text-xs font-medium rounded-xl border border-rose-200">
              {geoError}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
