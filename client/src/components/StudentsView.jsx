import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, Plus, Search, Filter, Phone, Calendar, 
  CheckCircle, AlertTriangle, ShieldAlert, Award, MessageSquare, 
  DollarSign, FileText, ChevronRight, X, Clock, Car, ExternalLink,
  Edit, Trash2, Shield
} from 'lucide-react';
import { exportStudentReceiptPDF } from '../utils/pdfGenerator';

export function StudentsView({ isAdmissionModalOpen, setIsAdmissionModalOpen }) {
  const { 
    currentUser, 
    isSuperAdmin,
    hasPermission,
    selectedBranchId, 
    branches, 
    courseTypes, 
    apiFetch, 
    showToast, 
    triggerWhatsAppReminder,
    settings 
  } = useApp();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [day10Filter, setDay10Filter] = useState(false);

  // Modals state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);

  // Payment Form state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // New Student Admission Form state
  const [admissionForm, setAdmissionForm] = useState({
    course_type_id: '',
    branch_id: '',
    primary_instructor_id: '',
    batch_id: '',
    name: '',
    phone: '',
    email: '',
    gender: 'Male',
    dob: '',
    address: '',
    admission_date: new Date().toISOString().split('T')[0],
    discount_given: 0,
    advance_paid: 0,
    advance_payment_mode: 'Cash',
    // Conditional RTO details
    ll_application_no: '',
    ll_receipt_no: '',
    ll_receipt_amount: 0,
    ll_issue_date: '',
    ll_expiry_date: '',
    dl_application_no: '',
    dl_receipt_no: '',
    dl_receipt_amount: 0,
    dl_number: '',
    dl_expiry_date: ''
  });

  // Edit Student Modal state
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [editStudentForm, setEditStudentForm] = useState({
    id: null,
    enroll_id: '',
    name: '',
    phone: '',
    email: '',
    gender: 'Male',
    dob: '',
    address: '',
    primary_instructor_id: '',
    batch_id: '',
    status: 'active',
    ll_application_no: '',
    ll_receipt_no: '',
    ll_receipt_amount: 0,
    ll_issue_date: '',
    ll_expiry_date: '',
    dl_application_no: '',
    dl_receipt_no: '',
    dl_receipt_amount: 0,
    dl_number: '',
    dl_expiry_date: '',
    rto_test_status: 'pending',
    rto_test_date: '',
    branch_id: '',
    net_total_fee: 0,
    pending_balance: 0,
    days_completed: 0,
    total_course_days: 26,
    admission_date: '',
    expected_end_date: ''
  });

  // Edit Payment Receipt Modal state
  const [isEditPaymentOpen, setIsEditPaymentOpen] = useState(false);
  const [editPaymentForm, setEditPaymentForm] = useState({
    id: null,
    receipt_no: '',
    amount: '',
    payment_mode: 'Cash',
    payment_date: '',
    notes: ''
  });

  const [instructorsList, setInstructorsList] = useState([]);
  const [batchesList, setBatchesList] = useState([]);

  // Load auxiliary lists (instructors & batches)
  const loadAuxData = async () => {
    try {
      const uRes = await apiFetch('/api/auth/users');
      if (uRes.users) {
        setInstructorsList(uRes.users.filter(u => u.role === 'instructor'));
      }
      const bRes = await apiFetch('/api/batches');
      if (bRes.batches) {
        setBatchesList(bRes.batches);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAuxData();
  }, []);

  // Fetch Students
  const fetchStudents = async () => {
    setLoading(true);
    try {
      let url = `/api/students?1=1`;
      if (selectedBranchId) url += `&branchId=${selectedBranchId}`;
      if (riskFilter) url += `&risk=${riskFilter}`;
      if (day10Filter) url += `&day10Only=true`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const data = await apiFetch(url);
      if (data.students) setStudents(data.students);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedBranchId, riskFilter, day10Filter, search]);

  // Load instructors and batches when admission modal opens
  useEffect(() => {
    if (isAdmissionModalOpen) {
      async function loadAux() {
        try {
          const uRes = await apiFetch('/api/auth/users');
          if (uRes.users) {
            setInstructorsList(uRes.users.filter(u => u.role === 'instructor'));
          }
          const bRes = await apiFetch('/api/batches');
          if (bRes.batches) {
            setBatchesList(bRes.batches);
          }
        } catch (e) {
          console.error(e);
        }
      }
      loadAux();

      // Reset form defaults
      setAdmissionForm({
        course_type_id: courseTypes[0]?.id || '',
        branch_id: currentUser?.role === 'super_admin' ? (selectedBranchId || branches[0]?.id || 1) : currentUser?.branch_id,
        primary_instructor_id: '',
        batch_id: '',
        name: '',
        phone: '',
        email: '',
        gender: 'Male',
        dob: '',
        address: '',
        admission_date: new Date().toISOString().split('T')[0],
        discount_given: 0,
        advance_paid: 0,
        advance_payment_mode: 'Cash',
        ll_application_no: '',
        ll_receipt_no: '',
        ll_receipt_amount: 0,
        ll_issue_date: '',
        ll_expiry_date: '',
        dl_application_no: '',
        dl_receipt_no: '',
        dl_receipt_amount: 0,
        dl_number: '',
        dl_expiry_date: ''
      });
    }
  }, [isAdmissionModalOpen]);

  // View Student Full Details
  const handleOpenDetails = async (student) => {
    setSelectedStudent(student);
    try {
      const data = await apiFetch(`/api/students/${student.id}`);
      setStudentDetails(data);
      setIsDetailModalOpen(true);
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  // Open Payment Modal
  const handleOpenPayment = (student) => {
    setSelectedStudent(student);
    setPaymentAmount(student.pending_balance);
    setPaymentMode('Cash');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  // Submit Payment
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      showToast('Please enter a valid payment amount.', 'error');
      return;
    }

    try {
      const res = await apiFetch(`/api/students/${selectedStudent.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(paymentAmount),
          payment_mode: paymentMode,
          notes: paymentNotes
        })
      });

      showToast(`Fee Payment of ₹${paymentAmount} recorded successfully! Receipt: ${res.receipt_no}`);
      setIsPaymentModalOpen(false);

      // Offer instant receipt download
      exportStudentReceiptPDF(
        { ...selectedStudent, pending_balance: selectedStudent.pending_balance - Number(paymentAmount) },
        { receipt_no: res.receipt_no, amount: Number(paymentAmount), payment_mode: paymentMode },
        { schoolName: settings.app_name }
      );

      fetchStudents();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Open Edit Student Modal
  const handleOpenEditStudent = async (student) => {
    try {
      const res = await apiFetch(`/api/students/${student.id}`);
      const s = res.student || student;
      setEditStudentForm({
        id: s.id,
        enroll_id: s.enroll_id || '',
        name: s.name || '',
        phone: s.phone || '',
        email: s.email || '',
        gender: s.gender || 'Male',
        dob: s.dob || '',
        address: s.address || '',
        primary_instructor_id: s.primary_instructor_id || '',
        batch_id: s.batch_id || '',
        status: s.status || 'active',
        ll_application_no: s.ll_application_no || '',
        ll_receipt_no: s.ll_receipt_no || '',
        ll_receipt_amount: s.ll_receipt_amount || 0,
        ll_issue_date: s.ll_issue_date || '',
        ll_expiry_date: s.ll_expiry_date || '',
        dl_application_no: s.dl_application_no || '',
        dl_receipt_no: s.dl_receipt_no || '',
        dl_receipt_amount: s.dl_receipt_amount || 0,
        dl_number: s.dl_number || '',
        dl_expiry_date: s.dl_expiry_date || '',
        rto_test_status: s.rto_test_status || 'pending',
        rto_test_date: s.rto_test_date || '',
        branch_id: s.branch_id || '',
        net_total_fee: s.net_total_fee || 0,
        pending_balance: s.pending_balance || 0,
        days_completed: s.days_completed || 0,
        total_course_days: s.total_course_days || 26,
        admission_date: s.admission_date || '',
        expected_end_date: s.expected_end_date || ''
      });
      loadAuxData();
      setIsEditStudentOpen(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Submit Edit Student
  const handleSubmitEditStudent = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/students/${editStudentForm.id}`, {
        method: 'PUT',
        body: JSON.stringify(editStudentForm)
      });
      showToast(`Student record for "${editStudentForm.name}" updated successfully!`);
      setIsEditStudentOpen(false);
      fetchStudents();
      if (selectedStudent && selectedStudent.id === editStudentForm.id) {
        handleOpenDetails({ id: editStudentForm.id });
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Student Record (Master Super Admin or with manage_students privilege)
  const handleDeleteStudent = async (student) => {
    const isMaster = isSuperAdmin ? ' [MASTER DELETE: Super Admin]' : '';
    if (!window.confirm(`Are you sure you want to permanently delete student "${student.name}" (${student.enroll_id})?${isMaster}\n\nWARNING: All fee payments and attendance records for this student will be permanently removed.`)) {
      return;
    }
    try {
      const res = await apiFetch(`/api/students/${student.id}`, {
        method: 'DELETE'
      });
      showToast(res.message || 'Student record deleted permanently');
      if (selectedStudent?.id === student.id) {
        setIsDetailModalOpen(false);
      }
      fetchStudents();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Open Edit Payment Modal
  const handleOpenEditPayment = (payment) => {
    setEditPaymentForm({
      id: payment.id,
      receipt_no: payment.receipt_no,
      amount: payment.amount,
      payment_mode: payment.payment_mode || 'Cash',
      payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
      notes: payment.notes || ''
    });
    setIsEditPaymentOpen(true);
  };

  // Submit Edit Payment
  const handleSubmitEditPayment = async (e) => {
    e.preventDefault();
    if (!editPaymentForm.amount || Number(editPaymentForm.amount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    try {
      await apiFetch(`/api/students/${studentDetails.student.id}/payments/${editPaymentForm.id}`, {
        method: 'PUT',
        body: JSON.stringify(editPaymentForm)
      });
      showToast(`Payment receipt ${editPaymentForm.receipt_no} updated! Balance recalculated.`);
      setIsEditPaymentOpen(false);
      const updatedDetails = await apiFetch(`/api/students/${studentDetails.student.id}`);
      setStudentDetails(updatedDetails);
      fetchStudents();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Payment
  const handleDeletePayment = async (payment) => {
    if (!window.confirm(`Are you sure you want to delete payment receipt "${payment.receipt_no}" for ₹${payment.amount}?\n\nThe student pending balance will automatically be adjusted upwards.`)) {
      return;
    }
    try {
      await apiFetch(`/api/students/${studentDetails.student.id}/payments/${payment.id}`, {
        method: 'DELETE'
      });
      showToast(`Receipt ${payment.receipt_no} deleted. Balances updated.`);
      const updatedDetails = await apiFetch(`/api/students/${studentDetails.student.id}`);
      setStudentDetails(updatedDetails);
      fetchStudents();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Selected Course Type Helper for Admission form
  const selectedCourse = courseTypes.find(c => c.id === Number(admissionForm.course_type_id)) || courseTypes[0];
  const baseFee = selectedCourse ? Number(selectedCourse.base_fee) : 0;
  const discountGiven = Number(admissionForm.discount_given) || 0;
  const netTotalFee = Math.max(0, baseFee - discountGiven);
  const advancePaid = Number(admissionForm.advance_paid) || 0;
  const pendingBalance = Math.max(0, netTotalFee - advancePaid);

  // Staff max discount validation check
  const staffMaxDiscount = currentUser?.role === 'super_admin' ? 999999 : Number(currentUser?.max_discount_limit || 0);
  const isDiscountExceeded = discountGiven > staffMaxDiscount;

  // Submit Admission
  const handleSubmitAdmission = async (e) => {
    e.preventDefault();
    if (isDiscountExceeded) {
      showToast(`Discount exceeds your max allowed limit of ₹${staffMaxDiscount}.`, 'error');
      return;
    }

    try {
      const payload = {
        ...admissionForm,
        course_type_id: selectedCourse?.id,
        discount_given: discountGiven,
        advance_paid: advancePaid
      };

      const res = await apiFetch('/api/students', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      showToast(`Student ${res.student?.name} enrolled successfully! Enroll ID: ${res.student?.enroll_id}`);
      setIsAdmissionModalOpen(false);
      fetchStudents();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">

      {/* Header & Controls (Registered Students Directory) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-purple-600" />
            <span>Registered Students Directory</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain master student records, branch assignments, and historical enrollments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdmissionModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-purple-600/20 transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register Student</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        
        <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, phone or reg no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 mr-1">
            Total Students: <span className="text-slate-900 font-bold">{students.length}</span>
          </span>
          
          {/* Day 10 Filter Toggle */}
          <button
            onClick={() => setDay10Filter(!day10Filter)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              day10Filter 
                ? 'bg-amber-500 text-white shadow-xs' 
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Day 10 Soft Warnings Only</span>
          </button>

          {/* Risk Level Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setRiskFilter('')}
              className={`px-2.5 py-1 rounded-md transition-all ${!riskFilter ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              All Risks
            </button>
            <button
              onClick={() => setRiskFilter('HIGH')}
              className={`px-2.5 py-1 rounded-md transition-all ${riskFilter === 'HIGH' ? 'bg-rose-600 text-white shadow-2xs font-bold' : 'text-rose-700 hover:bg-rose-50'}`}
            >
              🔴 High
            </button>
            <button
              onClick={() => setRiskFilter('MEDIUM')}
              className={`px-2.5 py-1 rounded-md transition-all ${riskFilter === 'MEDIUM' ? 'bg-amber-500 text-white shadow-2xs font-bold' : 'text-amber-800 hover:bg-amber-50'}`}
            >
              🟡 Med
            </button>
            <button
              onClick={() => setRiskFilter('LOW')}
              className={`px-2.5 py-1 rounded-md transition-all ${riskFilter === 'LOW' ? 'bg-emerald-600 text-white shadow-2xs font-bold' : 'text-emerald-700 hover:bg-emerald-50'}`}
            >
              🟢 Low
            </button>
          </div>

        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="md:hidden divide-y divide-slate-100">
          {students.map(s => (
            <div key={s.id} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {s.enroll_id}
                    </span>
                    {s.isDay10Warning && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        DAY 10
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      s.riskLevel === 'HIGH' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                      s.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {s.riskLevel} Risk
                    </span>
                  </div>
                  <div className="font-bold text-sm text-slate-900 mt-1 truncate">{s.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{s.phone}</span>
                    <span>·</span>
                    <span className="truncate">{s.branch_name}</span>
                  </div>
                </div>
                {s.isRtoGateUnlocked ? (
                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                    <CheckCircle className="w-3 h-3" />
                    <span>RTO Ready</span>
                  </span>
                ) : (
                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
                    <ShieldAlert className="w-3 h-3 text-amber-500" />
                    <span>Locked</span>
                  </span>
                )}
              </div>

              <div className="bg-slate-50 rounded-xl px-3 py-2 space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800 truncate">{s.course_name}</span>
                  <span className="shrink-0 font-bold text-slate-700">
                    Day {s.days_completed}/{s.total_course_days}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (s.days_completed / s.total_course_days) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate">{s.batch_time_slot || 'Unassigned'} · {s.instructor_name || 'No Instructor'}</span>
                  <span className="font-bold shrink-0">
                    {s.pending_balance > 0 ? (
                      <span className="text-amber-600">₹{s.pending_balance.toLocaleString('en-IN')} due</span>
                    ) : (
                      <span className="text-emerald-600">Paid</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-1.5 pt-0.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {s.pending_balance > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => triggerWhatsAppReminder(s)}
                        className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                        title="Send pre-filled WhatsApp Fee Reminder"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenPayment(s)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Collect
                      </button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {(isSuperAdmin || hasPermission('manage_students')) && (
                    <button
                      type="button"
                      onClick={() => handleOpenEditStudent(s)}
                      className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
                      title={isSuperAdmin ? 'Master Edit Student Record (Super Admin)' : 'Edit Student Record'}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {(isSuperAdmin || hasPermission('delete_students') || hasPermission('manage_students')) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteStudent(s)}
                      className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                      title={isSuperAdmin ? 'Master Delete Student (Permanent)' : 'Delete Student Record'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenDetails(s)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <span>Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3 px-4">Enroll ID & Student</th>
                <th className="py-3 px-3">Branch & Batch</th>
                <th className="py-3 px-3">Course & Instructor</th>
                <th className="py-3 px-3">Training Days</th>
                <th className="py-3 px-3">Financial Status</th>
                <th className="py-3 px-3">RTO Gate</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  
                  {/* Enroll ID & Student */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {s.enroll_id}
                      </span>
                      {s.isDay10Warning && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200" title="Day 10 warning triggered">
                          DAY 10
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-slate-900 mt-1">{s.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{s.phone}</span>
                    </div>
                  </td>

                  {/* Branch & Batch */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800">{s.branch_name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{s.batch_time_slot || 'Unassigned'}</span>
                    </div>
                  </td>

                  {/* Course & Instructor */}
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-800 truncate max-w-xs">{s.course_name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Instructor: <span className="font-semibold text-slate-700">{s.instructor_name || 'Unassigned'}</span>
                    </div>
                  </td>

                  {/* Training Days Progress & Strategy A Target */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <span>Day {s.days_completed}/{s.total_course_days}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({Math.round((s.days_completed / s.total_course_days) * 100)}%)
                      </span>
                    </div>
                    <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all" 
                        style={{ width: `${Math.min(100, (s.days_completed / s.total_course_days) * 100)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Target: <span className="font-mono">{s.expected_end_date}</span>
                    </div>
                  </td>

                  {/* Financial Status & Risk Matrix Badge */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">
                      {s.pending_balance > 0 ? (
                        <span className="text-amber-600">₹{s.pending_balance.toLocaleString('en-IN')} due</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">Paid in Full</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Total: ₹{s.net_total_fee.toLocaleString('en-IN')} (Paid: ₹{s.total_paid.toLocaleString('en-IN')})
                    </div>
                    <div className="mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        s.riskLevel === 'HIGH' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        s.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {s.riskLevel} Risk
                      </span>
                    </div>
                  </td>

                  {/* Module 6: RTO Test Hard Gate Status */}
                  <td className="py-3 px-3">
                    {s.isRtoGateUnlocked ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Ready for RTO</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md" title="Hard Gate: Requires 100% days complete and ₹0 balance">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                        <span>Gate Locked</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      
                      {/* WhatsApp Reminder Button (Module 7) */}
                      {s.pending_balance > 0 && (
                        <button
                          onClick={() => triggerWhatsAppReminder(s)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                          title="Send pre-filled WhatsApp Fee Reminder"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Collect Fee Payment Button */}
                      {s.pending_balance > 0 && (
                        <button
                          onClick={() => handleOpenPayment(s)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-[11px] transition-colors"
                          title="Record fee payment"
                        >
                          Collect
                        </button>
                      )}

                      {/* Details Drawer Button */}
                      <button
                        onClick={() => handleOpenDetails(s)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                        title="View Full Profile"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Edit Student Record */}
                      {(isSuperAdmin || hasPermission('manage_students')) && (
                        <button
                          onClick={() => handleOpenEditStudent(s)}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
                          title={isSuperAdmin ? "Master Edit Student Record (Super Admin)" : "Edit Student Record"}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete Student Record */}
                      {(isSuperAdmin || hasPermission('delete_students') || hasPermission('manage_students')) && (
                        <button
                          onClick={() => handleDeleteStudent(s)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                          title={isSuperAdmin ? "Master Delete Student (Permanent)" : "Delete Student Record"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: NEW STUDENT ADMISSION (Modules 1, 4 Controlled Pricing) */}
      {/* ============================================================== */}
      {isAdmissionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8">
            
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">Student Admission & Registration Engine</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Controlled pricing, live discount privilege check, branch sequence auto-tagging, and RTO section.
                </p>
              </div>
              <button 
                onClick={() => setIsAdmissionModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdmission} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Section 1: Course & Branch Selection */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">1. Course Package & Branch Slot</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Branch Assignment */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Branch</label>
                    {currentUser?.role === 'super_admin' ? (
                      <select
                        value={admissionForm.branch_id}
                        onChange={(e) => setAdmissionForm({ ...admissionForm, branch_id: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={`${currentUser?.branch_name} (${currentUser?.branch_code}) [Auto-Assigned]`}
                        readOnly
                        className="w-full px-3 py-2 text-xs bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-medium cursor-not-allowed"
                      />
                    )}
                  </div>

                  {/* Course Type Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Course Type</label>
                    <select
                      value={admissionForm.course_type_id}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, course_type_id: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {courseTypes.filter(c => c.is_active).map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} — ₹{c.base_fee} ({c.duration_days} Days)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Batch Slot Selection (Instructor automatically linked via batch) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Batch 1-Hour Time Slot & Assigned Instructor</label>
                    <select
                      value={admissionForm.batch_id}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, batch_id: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="">Select Batch Slot...</option>
                      {batchesList.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.time_slot}) {b.instructor_name ? `• Instructor: ${b.instructor_name}` : ''} — {b.enrolled_count}/{b.capacity} Enrolled
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      💡 The student will be automatically assigned to the designated driving instructor of this batch slot.
                    </p>
                  </div>

                </div>
              </div>

              {/* Section 2: Personal & Contact Information */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">2. Student Profile</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Student Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Vijay Patil"
                      value={admissionForm.name}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Unified Contact Phone *</label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={admissionForm.phone}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="name@email.com"
                      value={admissionForm.email}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                    <select
                      value={admissionForm.gender}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, gender: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={admissionForm.dob}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, dob: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Date</label>
                    <input
                      type="date"
                      value={admissionForm.admission_date}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, admission_date: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                    <input
                      type="text"
                      placeholder="Street address, colony, city"
                      value={admissionForm.address}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, address: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                </div>
              </div>

              {/* Section 3: Controlled Pricing & Discount Validation (Module 4) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center justify-between">
                  <span>3. Controlled Pricing & Discount Validation</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    Your Max Authorized Discount: <strong className="text-slate-800">₹{staffMaxDiscount}</strong>
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  
                  {/* Read-Only Base Fee */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Course Base Fee (Locked)</label>
                    <div className="px-3 py-2 bg-slate-200/80 text-slate-800 rounded-xl text-xs font-bold font-mono">
                      ₹{baseFee.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Discount Input with Live Validation */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Discount Given (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={admissionForm.discount_given}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, discount_given: Number(e.target.value) })}
                      className={`w-full px-3 py-2 text-xs rounded-xl font-bold font-mono border focus:outline-none focus:ring-2 ${
                        isDiscountExceeded 
                          ? 'border-rose-500 bg-rose-50 text-rose-800 focus:ring-rose-500' 
                          : 'border-slate-200 bg-white text-slate-900 focus:ring-blue-500'
                      }`}
                    />
                    {isDiscountExceeded && (
                      <p className="text-[10px] text-rose-600 font-bold mt-1">
                        ⚠️ Exceeds your authorized ₹{staffMaxDiscount} limit!
                      </p>
                    )}
                  </div>

                  {/* Net Total Fee */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Net Total Fee</label>
                    <div className="px-3 py-2 bg-white text-blue-800 border border-blue-200 rounded-xl text-xs font-bold font-mono">
                      ₹{netTotalFee.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Advance Paid */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Advance Token Paid (₹)</label>
                    <input
                      type="number"
                      min="0"
                      max={netTotalFee}
                      value={admissionForm.advance_paid}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, advance_paid: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-white text-emerald-800 border border-emerald-300 rounded-xl font-bold font-mono focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Advance Payment Mode:</span>
                    <select
                      value={admissionForm.advance_payment_mode}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, advance_payment_mode: e.target.value })}
                      className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg font-medium"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-slate-500">Pending Course Balance: </span>
                    <strong className="text-amber-600 font-mono text-sm">₹{pendingBalance.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>

              {/* Section 4: Conditional RTO & License Section (Dynamic) */}
              {selectedCourse?.is_license_course ? (
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                      4. Conditional RTO & License Section (Active for License Course)
                    </h4>
                  </div>

                  <div className="space-y-4">
                    {/* LL Stage Fields */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-600 uppercase">Learner's License (LL) Stage</span>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-1.5">
                        <input
                          type="text"
                          placeholder="LL Application No."
                          value={admissionForm.ll_application_no}
                          onChange={(e) => setAdmissionForm({ ...admissionForm, ll_application_no: e.target.value })}
                          className="px-3 py-2 text-xs bg-white border border-blue-200 rounded-xl"
                        />
                        <input
                          type="text"
                          placeholder="LL Receipt No."
                          value={admissionForm.ll_receipt_no}
                          onChange={(e) => setAdmissionForm({ ...admissionForm, ll_receipt_no: e.target.value })}
                          className="px-3 py-2 text-xs bg-white border border-blue-200 rounded-xl"
                        />
                        <input
                          type="number"
                          placeholder="LL Fee Amount (₹)"
                          value={admissionForm.ll_receipt_amount || ''}
                          onChange={(e) => setAdmissionForm({ ...admissionForm, ll_receipt_amount: e.target.value })}
                          className="px-3 py-2 text-xs bg-white border border-blue-200 rounded-xl font-mono"
                        />
                        <input
                          type="date"
                          placeholder="LL Issue Date"
                          value={admissionForm.ll_issue_date}
                          onChange={(e) => setAdmissionForm({ ...admissionForm, ll_issue_date: e.target.value })}
                          className="px-3 py-2 text-xs bg-white border border-blue-200 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* DL Stage Fields */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-600 uppercase">Driving License (DL) Stage</span>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-1.5">
                        <input
                          type="text"
                          placeholder="DL Application No."
                          value={admissionForm.dl_application_no}
                          onChange={(e) => setAdmissionForm({ ...admissionForm, dl_application_no: e.target.value })}
                          className="px-3 py-2 text-xs bg-white border border-blue-200 rounded-xl"
                        />
                        <input
                          type="text"
                          placeholder="DL Receipt No."
                          value={admissionForm.dl_receipt_no}
                          onChange={(e) => setAdmissionForm({ ...admissionForm, dl_receipt_no: e.target.value })}
                          className="px-3 py-2 text-xs bg-white border border-blue-200 rounded-xl"
                        />
                        <input
                          type="text"
                          placeholder="Final DL Number"
                          value={admissionForm.dl_number}
                          onChange={(e) => setAdmissionForm({ ...admissionForm, dl_number: e.target.value })}
                          className="px-3 py-2 text-xs bg-white border border-blue-200 rounded-xl font-mono uppercase"
                        />
                        <input
                          type="date"
                          placeholder="DL Expiry Date"
                          value={admissionForm.dl_expiry_date}
                          onChange={(e) => setAdmissionForm({ ...admissionForm, dl_expiry_date: e.target.value })}
                          className="px-3 py-2 text-xs bg-white border border-blue-200 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 text-slate-500 rounded-xl text-xs border border-slate-200 flex items-center gap-2">
                  <span>ℹ️ RTO License section disabled for practice-only course.</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdmissionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDiscountExceeded}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
                >
                  Confirm Admission & Issue Enroll ID
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: COLLECT FEE PAYMENT (Receipt Generation) */}
      {/* ============================================================== */}
      {isPaymentModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            
            <div className="p-5 bg-blue-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm">Collect Course Fee Payment</h3>
                <p className="text-xs text-blue-100 mt-0.5">{selectedStudent.name} ({selectedStudent.enroll_id})</p>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-7 h-7 rounded-full bg-blue-700 text-blue-200 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-5 space-y-4">
              
              <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between items-center border border-slate-200">
                <span className="text-slate-500">Current Outstanding Balance:</span>
                <strong className="text-amber-600 font-mono text-sm font-bold">
                  ₹{selectedStudent.pending_balance.toLocaleString('en-IN')}
                </strong>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedStudent.pending_balance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Transaction Reference</label>
                <input
                  type="text"
                  placeholder="Optional reference / UTR number"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20"
                >
                  Confirm Payment & Download PDF Receipt
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: STUDENT FULL PROFILE DRAWER (Payments & Attendance) */}
      {/* ============================================================== */}
      {isDetailModalOpen && studentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                    {studentDetails.student.enroll_id}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    studentDetails.student.riskLevel === 'HIGH' ? 'bg-rose-900 text-rose-200' :
                    studentDetails.student.riskLevel === 'MEDIUM' ? 'bg-amber-900 text-amber-200' :
                    'bg-emerald-900 text-emerald-200'
                  }`}>
                    {studentDetails.student.riskLevel} Risk
                  </span>
                </div>
                <h3 className="text-base font-black text-white mt-1">{studentDetails.student.name}</h3>
              </div>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              
              {/* Financial & Strategy A Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium">Training Progress</span>
                  <div className="text-base font-bold text-slate-800 mt-1">
                    Day {studentDetails.student.days_completed}/{studentDetails.student.total_course_days}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium">Graduation Date</span>
                  <div className="text-sm font-bold text-slate-800 font-mono mt-1">
                    {studentDetails.student.expected_end_date}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium">Total Paid</span>
                  <div className="text-base font-bold text-emerald-600 mt-1">
                    ₹{studentDetails.student.total_paid}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium">Pending Balance</span>
                  <div className="text-base font-bold text-amber-600 mt-1">
                    ₹{studentDetails.student.pending_balance}
                  </div>
                </div>
              </div>

              {/* RTO Hard Gate Status */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                studentDetails.student.isRtoGateUnlocked 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center gap-2.5">
                  {studentDetails.student.isRtoGateUnlocked ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                  )}
                  <div>
                    <h5 className="font-bold">
                      {studentDetails.student.isRtoGateUnlocked 
                        ? 'RTO Driving Test Gate Unlocked' 
                        : 'RTO Driving Test Hard Gate Active'}
                    </h5>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {studentDetails.student.isRtoGateUnlocked 
                        ? 'Student is 100% training-complete with ₹0 pending balance. Ready to schedule test.' 
                        : 'System locks final test scheduling until days_completed == total_course_days AND pending_balance == 0.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment History Ledger */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Payment History Ledger</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Receipt No</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Mode</th>
                        <th className="py-2 px-3">Amount</th>
                        <th className="py-2 px-3">Collected By</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentDetails.payments?.map(p => (
                        <tr key={p.id}>
                          <td className="py-2 px-3 font-mono font-bold text-blue-700">{p.receipt_no}</td>
                          <td className="py-2 px-3 text-slate-600">{p.payment_date}</td>
                          <td className="py-2 px-3 text-slate-600">{p.payment_mode}</td>
                          <td className="py-2 px-3 font-bold text-emerald-700">₹{p.amount}</td>
                          <td className="py-2 px-3 text-slate-500">{p.collected_by_name || 'Staff'}</td>
                          <td className="py-2 px-3 text-right">
                            {(isSuperAdmin || hasPermission('delete_payments') || hasPermission('manage_students')) && (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditPayment(p)}
                                  className="p-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
                                  title="Edit Payment Receipt"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePayment(p)}
                                  className="p-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                                  title="Delete Payment Receipt"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {(!studentDetails.payments || studentDetails.payments.length === 0) && (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-400">No payments logged yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Attendance Log Preview */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Strategy A Attendance History</h4>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Notes / Strategy A Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentDetails.attendance?.map(a => (
                        <tr key={a.id}>
                          <td className="py-2 px-3 font-mono text-slate-700">{a.date}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              a.status === 'present' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500">
                            {a.status === 'absent' ? 'Graduation extended by +1 calendar day' : (a.notes || 'Day completed')}
                          </td>
                        </tr>
                      ))}
                      {(!studentDetails.attendance || studentDetails.attendance.length === 0) && (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-slate-400">No attendance marked yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: EDIT STUDENT PROFILE (With Super Admin Master Overrides) */}
      {/* ============================================================== */}
      {isEditStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                    {editStudentForm.enroll_id}
                  </span>
                  {isSuperAdmin && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 flex items-center gap-1 uppercase">
                      <Shield className="w-3 h-3" />
                      <span>Super Admin Master Access</span>
                    </span>
                  )}
                </div>
                <h3 className="text-base font-black text-white mt-1">
                  Edit Student Record: {editStudentForm.name}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditStudentOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditStudent} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
              
              {/* Section 1: Basic Information */}
              <div>
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-1.5 text-xs uppercase tracking-wider text-blue-700">
                  <Users className="w-4 h-4" />
                  <span>1. Student Profile & Contact</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editStudentForm.name}
                      onChange={e => setEditStudentForm({ ...editStudentForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mobile Phone *</label>
                    <input
                      type="tel"
                      required
                      value={editStudentForm.phone}
                      onChange={e => setEditStudentForm({ ...editStudentForm, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editStudentForm.email}
                      onChange={e => setEditStudentForm({ ...editStudentForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                    <select
                      value={editStudentForm.gender}
                      onChange={e => setEditStudentForm({ ...editStudentForm, gender: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={editStudentForm.dob || ''}
                      onChange={e => setEditStudentForm({ ...editStudentForm, dob: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Account Status</label>
                    <select
                      value={editStudentForm.status}
                      onChange={e => setEditStudentForm({ ...editStudentForm, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    >
                      <option value="active">Active Trainee</option>
                      <option value="completed">Completed / Graduated</option>
                      <option value="discontinued">Discontinued / Dropped</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={editStudentForm.address || ''}
                    onChange={e => setEditStudentForm({ ...editStudentForm, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Section 2: Batch & Instructor Pairing */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-1.5 text-xs uppercase tracking-wider text-blue-700">
                  <Clock className="w-4 h-4" />
                  <span>2. Batch Slot & Instructor Assignment</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Training Batch Time Slot & Assigned Instructor</label>
                    <select
                      value={editStudentForm.batch_id || ''}
                      onChange={e => {
                        const bId = e.target.value ? Number(e.target.value) : '';
                        const selBatch = batchesList.find(b => b.id === bId);
                        setEditStudentForm({ 
                          ...editStudentForm, 
                          batch_id: bId,
                          primary_instructor_id: selBatch?.instructor_id || editStudentForm.primary_instructor_id
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                    >
                      <option value="">-- Unassigned / Flexible --</option>
                      {batchesList.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.time_slot}) {b.instructor_name ? `• Instructor: ${b.instructor_name}` : ''} — {b.branch_name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">Instructor is automatically linked to the student from the assigned batch slot.</p>
                  </div>
                </div>
              </div>

              {/* Section 3: RTO Hard Gate & Driving License Details */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-1.5 text-xs uppercase tracking-wider text-blue-700">
                  <CheckCircle className="w-4 h-4" />
                  <span>3. RTO Application & Test Scheduling</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">RTO Test Status</label>
                    <select
                      value={editStudentForm.rto_test_status || 'pending'}
                      onChange={e => setEditStudentForm({ ...editStudentForm, rto_test_status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    >
                      <option value="pending">Pending Completion</option>
                      <option value="scheduled">Scheduled for Driving Test</option>
                      <option value="passed">Passed / License Approved</option>
                      <option value="failed">Test Re-attempt Required</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">RTO Test Date</label>
                    <input
                      type="date"
                      value={editStudentForm.rto_test_date || ''}
                      onChange={e => setEditStudentForm({ ...editStudentForm, rto_test_date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Learner (LL) App No</label>
                    <input
                      type="text"
                      value={editStudentForm.ll_application_no || ''}
                      onChange={e => setEditStudentForm({ ...editStudentForm, ll_application_no: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">LL Receipt No</label>
                    <input
                      type="text"
                      value={editStudentForm.ll_receipt_no || ''}
                      onChange={e => setEditStudentForm({ ...editStudentForm, ll_receipt_no: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">LL Issue Date</label>
                    <input
                      type="date"
                      value={editStudentForm.ll_issue_date || ''}
                      onChange={e => setEditStudentForm({ ...editStudentForm, ll_issue_date: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">LL Expiry Date</label>
                    <input
                      type="date"
                      value={editStudentForm.ll_expiry_date || ''}
                      onChange={e => setEditStudentForm({ ...editStudentForm, ll_expiry_date: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Perm DL App No</label>
                    <input
                      type="text"
                      value={editStudentForm.dl_application_no || ''}
                      onChange={e => setEditStudentForm({ ...editStudentForm, dl_application_no: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Perm DL Number</label>
                    <input
                      type="text"
                      value={editStudentForm.dl_number || ''}
                      onChange={e => setEditStudentForm({ ...editStudentForm, dl_number: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">DL Receipt No</label>
                    <input
                      type="text"
                      value={editStudentForm.dl_receipt_no || ''}
                      onChange={e => setEditStudentForm({ ...editStudentForm, dl_receipt_no: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">DL Expiry Date</label>
                    <input
                      type="date"
                      value={editStudentForm.dl_expiry_date || ''}
                      onChange={e => setEditStudentForm({ ...editStudentForm, dl_expiry_date: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Super Admin Master Overrides */}
              {isSuperAdmin && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-700" />
                    <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider">
                      Master Authority Overrides (Super Admin Only)
                    </h4>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Directly change student branch assignment, adjust fees and balances, and correct attendance days or course duration.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">Branch Re-assignment</label>
                      <select
                        value={editStudentForm.branch_id}
                        onChange={e => setEditStudentForm({ ...editStudentForm, branch_id: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold"
                      >
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">Net Total Fee (₹)</label>
                      <input
                        type="number"
                        value={editStudentForm.net_total_fee}
                        onChange={e => setEditStudentForm({ ...editStudentForm, net_total_fee: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">Pending Balance (₹)</label>
                      <input
                        type="number"
                        value={editStudentForm.pending_balance}
                        onChange={e => setEditStudentForm({ ...editStudentForm, pending_balance: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-mono font-bold text-amber-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">Days Completed</label>
                      <input
                        type="number"
                        value={editStudentForm.days_completed}
                        onChange={e => setEditStudentForm({ ...editStudentForm, days_completed: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">Total Course Days</label>
                      <input
                        type="number"
                        value={editStudentForm.total_course_days}
                        onChange={e => setEditStudentForm({ ...editStudentForm, total_course_days: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">Admission Date</label>
                      <input
                        type="date"
                        value={editStudentForm.admission_date || ''}
                        onChange={e => setEditStudentForm({ ...editStudentForm, admission_date: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">Expected End Date</label>
                      <input
                        type="date"
                        value={editStudentForm.expected_end_date || ''}
                        onChange={e => setEditStudentForm({ ...editStudentForm, expected_end_date: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditStudentOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Save Student Record Changes</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: EDIT PAYMENT RECEIPT */}
      {/* ============================================================== */}
      {isEditPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 bg-amber-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm">Edit Fee Payment Receipt</h3>
                <p className="text-xs text-amber-100 mt-0.5">{editPaymentForm.receipt_no}</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditPaymentOpen(false)}
                className="w-7 h-7 rounded-full bg-amber-700 text-amber-200 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditPayment} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Receipt Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editPaymentForm.amount}
                  onChange={e => setEditPaymentForm({ ...editPaymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-sm text-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-1">Student pending balance will automatically recalculate upon updating.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={editPaymentForm.payment_mode}
                  onChange={e => setEditPaymentForm({ ...editPaymentForm, payment_mode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={editPaymentForm.payment_date}
                  onChange={e => setEditPaymentForm({ ...editPaymentForm, payment_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Reference</label>
                <input
                  type="text"
                  value={editPaymentForm.notes || ''}
                  onChange={e => setEditPaymentForm({ ...editPaymentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  placeholder="Optional reference / reason for edit"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditPaymentOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Save Receipt Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
