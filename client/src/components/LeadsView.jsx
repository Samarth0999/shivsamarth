import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, Phone, MessageSquare, Search, Filter, CheckCircle2, 
  Clock, ArrowRight, UserCheck, Calendar, MapPin, RefreshCw, 
  ExternalLink, MessageCircle, AlertCircle, Edit, Trash2, Shield, X
} from 'lucide-react';

export function LeadsView({ onConvertSuccess }) {
  const { apiFetch, showToast, courseTypes, branches, isSuperAdmin, hasPermission } = useApp();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [convertingLead, setConvertingLead] = useState(null);
  const [convertForm, setConvertForm] = useState({
    course_type_id: 1,
    advance_paid: 1000,
    discount_given: 0
  });

  // Edit Lead Modal State
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'all' 
        ? '/api/leads' 
        : `/api/leads?status=${statusFilter}`;
      const data = await apiFetch(url);
      setLeads(data.leads || []);
    } catch (err) {
      showToast(err.message || 'Failed to load leads', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, statusFilter, showToast]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await apiFetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      showToast(`Lead marked as ${newStatus}`);
      loadLeads();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleNotesUpdate = async (leadId, notes) => {
    try {
      await apiFetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify({ notes })
      });
      showToast('Staff notes saved');
      loadLeads();
    } catch (err) {
      showToast(err.message || 'Failed to save notes', 'error');
    }
  };

  const handleConvertLead = async (e) => {
    e.preventDefault();
    if (!convertingLead) return;

    try {
      const data = await apiFetch(`/api/leads/${convertingLead.id}/convert`, {
        method: 'POST',
        body: JSON.stringify(convertForm)
      });

      showToast(`Success! Converted to Student ${data.enroll_id} (${data.student?.name})`);
      setConvertingLead(null);
      loadLeads();
      if (onConvertSuccess) onConvertSuccess(data.student);
    } catch (err) {
      showToast(err.message || 'Conversion failed', 'error');
    }
  };

  // Open Edit Lead Modal
  const handleOpenEditLead = (lead) => {
    setEditingLead({
      id: lead.id,
      name: lead.name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      course_name: lead.course_name || '',
      branch_id: lead.branch_id || branches[0]?.id || 1,
      preferred_time: lead.preferred_time || '',
      address: lead.address || '',
      status: lead.status || 'new',
      notes: lead.notes || ''
    });
    setIsEditLeadOpen(true);
  };

  // Submit Edit Lead
  const handleSubmitEditLead = async (e) => {
    e.preventDefault();
    if (!editingLead.name.trim() || !editingLead.phone.trim()) {
      showToast('Name and phone are required', 'error');
      return;
    }
    try {
      await apiFetch(`/api/leads/${editingLead.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingLead)
      });
      showToast(`Inquiry for ${editingLead.name} updated successfully!`);
      setIsEditLeadOpen(false);
      setEditingLead(null);
      loadLeads();
    } catch (err) {
      showToast(err.message || 'Failed to update lead', 'error');
    }
  };

  // Delete Lead Record
  const handleDeleteLead = async (lead) => {
    const isMaster = isSuperAdmin ? ' [MASTER DELETE: Super Admin]' : '';
    if (!window.confirm(`Are you sure you want to delete inquiry for "${lead.name}" (${lead.phone})?${isMaster}`)) return;
    try {
      const res = await apiFetch(`/api/leads/${lead.id}`, { method: 'DELETE' });
      showToast(res.message || 'Inquiry deleted');
      loadLeads();
    } catch (err) {
      showToast(err.message || 'Failed to delete lead', 'error');
    }
  };

  const filteredLeads = leads.filter(l => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.name?.toLowerCase().includes(term) ||
      l.phone?.toLowerCase().includes(term) ||
      l.course_name?.toLowerCase().includes(term) ||
      l.address?.toLowerCase().includes(term)
    );
  });

  const stats = {
    total: leads.length,
    newCount: leads.filter(l => l.status === 'new').length,
    contactedCount: leads.filter(l => l.status === 'contacted').length,
    convertedCount: leads.filter(l => l.status === 'converted').length
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-purple-600" />
            <span>Lead Pipeline Management</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track inquiries, manage follow-ups, and convert prospective students into admissions.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLeads}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm shadow-purple-600/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Leads</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Received</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">All landing page enquiries</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/30 shadow-sm">
          <div className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>New (Uncontacted)</span>
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">{stats.newCount}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Awaiting staff callback</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 bg-blue-50/30 shadow-sm">
          <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">In Discussion</div>
          <div className="text-2xl font-black text-blue-900 mt-1">{stats.contactedCount}</div>
          <div className="text-[11px] text-blue-600 mt-0.5">Demo slot or price negotiated</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/30 shadow-sm">
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Converted</div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{stats.convertedCount}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Enrolled into driving batches</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: 'All Inquiries' },
            { id: 'new', label: 'New' },
            { id: 'contacted', label: 'Contacted' },
            { id: 'converted', label: 'Converted' },
            { id: 'archived', label: 'Archived' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, phone, course..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

      </div>

      {/* Leads List / Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold">Loading prospective leads from database...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200/80 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-sm">No Inquiries Found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {searchTerm ? 'No results matched your search term.' : 'Website inquiries will appear here automatically when visitors fill the contact or booking form.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => {
            const phoneDigits = lead.phone?.replace(/\D/g, '') || '';
            const waPhone = phoneDigits.startsWith('91') ? phoneDigits : `91${phoneDigits}`;
            const isConverted = lead.status === 'converted';

            return (
              <div
                key={lead.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Left Details */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{lead.name}</h3>
                    
                    {/* Status Badge */}
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      lead.status === 'new'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : lead.status === 'contacted'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : lead.status === 'converted'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {lead.status}
                    </span>

                    {/* Source Badge */}
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-mono">
                      {lead.source || 'website'}
                    </span>

                    {lead.branch_name && (
                      <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {lead.branch_name}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      {lead.phone}
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="font-medium text-blue-700">
                      {lead.course_name || 'Practical Driving'}
                    </span>
                    {lead.preferred_time && (
                      <>
                        <span className="text-slate-400">|</span>
                        <span className="text-slate-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          {lead.preferred_time}
                        </span>
                      </>
                    )}
                    {lead.address && (
                      <>
                        <span className="text-slate-400">|</span>
                        <span className="text-slate-500">{lead.address}</span>
                      </>
                    )}
                  </div>

                  {lead.message && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{lead.message}"
                    </p>
                  )}
                </div>

                {/* Right Action Controls */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  
                  {/* WhatsApp Quick Chat */}
                  <a
                    href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Hello ${lead.name}, greetings from ShivSamarth Motor Driving School Beed! We received your inquiry for ${lead.course_name || 'driving classes'}. How can we assist you with demo scheduling?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                    title="Open WhatsApp Chat"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>

                  {/* Direct Call */}
                  <a
                    href={`tel:${lead.phone}`}
                    className="p-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                    title="Call Lead"
                  >
                    <Phone className="w-4 h-4" />
                  </a>

                  {/* Status Dropdown */}
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="new">Mark New</option>
                    <option value="contacted">Mark Contacted</option>
                    <option value="converted">Mark Converted</option>
                    <option value="archived">Archive</option>
                  </select>

                  {/* Edit Lead Details */}
                  {(isSuperAdmin || hasPermission('manage_leads')) && (
                    <button
                      type="button"
                      onClick={() => handleOpenEditLead(lead)}
                      className="p-2.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                      title={isSuperAdmin ? "Master Edit Lead (Super Admin)" : "Edit Lead Details"}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}

                  {/* Delete Lead Record */}
                  {(isSuperAdmin || hasPermission('delete_leads') || hasPermission('manage_leads')) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteLead(lead)}
                      className="p-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                      title={isSuperAdmin ? "Master Delete Lead (Super Admin)" : "Delete Lead"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Convert to Student Button */}
                  {!isConverted && (isSuperAdmin || hasPermission('convert_leads') || hasPermission('manage_leads')) && (
                    <button
                      onClick={() => {
                        setConvertingLead(lead);
                        setConvertForm({
                          course_type_id: lead.course_id || 1,
                          advance_paid: 1000,
                          discount_given: 0
                        });
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Convert to Student</span>
                    </button>
                  )}

                  {isConverted && (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Enrolled</span>
                    </span>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Convert Lead Modal */}
      {convertingLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <span>Convert Lead to Enrolled Student</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Creating admission record for <strong className="text-slate-800">{convertingLead.name}</strong> ({convertingLead.phone}). An Enroll ID (e.g. BEED-2026-XXX) will be automatically generated.
            </p>

            <form onSubmit={handleConvertLead} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Assigned Course Package
                </label>
                <select
                  value={convertForm.course_type_id}
                  onChange={(e) => setConvertForm(prev => ({ ...prev, course_type_id: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                >
                  {courseTypes?.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — ₹{Number(c.base_fee).toLocaleString('en-IN')} ({c.duration_days} Days)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Advance Paid (₹)
                  </label>
                  <input
                    type="number"
                    value={convertForm.advance_paid}
                    onChange={(e) => setConvertForm(prev => ({ ...prev, advance_paid: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    value={convertForm.discount_given}
                    onChange={(e) => setConvertForm(prev => ({ ...prev, discount_given: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConvertingLead(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-sm"
                >
                  Generate Enroll ID & Enroll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {isEditLeadOpen && editingLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-amber-600" />
                  <span>Edit Lead Inquiry</span>
                </h3>
                {isSuperAdmin && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mt-1 inline-block border border-amber-200">
                    Super Admin Master Authority
                  </span>
                )}
              </div>
              <button 
                type="button"
                onClick={() => { setIsEditLeadOpen(false); setEditingLead(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditLead} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingLead.name}
                    onChange={e => setEditingLead({ ...editingLead, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={editingLead.phone}
                    onChange={e => setEditingLead({ ...editingLead, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editingLead.email || ''}
                    onChange={e => setEditingLead({ ...editingLead, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Branch</label>
                  <select
                    value={editingLead.branch_id}
                    onChange={e => setEditingLead({ ...editingLead, branch_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-bold"
                  >
                    {branches?.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Interested Course</label>
                  <input
                    type="text"
                    value={editingLead.course_name || ''}
                    onChange={e => setEditingLead({ ...editingLead, course_name: e.target.value })}
                    placeholder="e.g. 26-Day Four Wheeler"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preferred Time Slot</label>
                  <input
                    type="text"
                    value={editingLead.preferred_time || ''}
                    onChange={e => setEditingLead({ ...editingLead, preferred_time: e.target.value })}
                    placeholder="e.g. 07:00 AM - 08:00 AM"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Inquiry Status</label>
                  <select
                    value={editingLead.status}
                    onChange={e => setEditingLead({ ...editingLead, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-bold"
                  >
                    <option value="new">New Lead</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted to Student</option>
                    <option value="archived">Archived / Cold</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Locality / Address</label>
                  <input
                    type="text"
                    value={editingLead.address || ''}
                    onChange={e => setEditingLead({ ...editingLead, address: e.target.value })}
                    placeholder="e.g. Swaraj Nagar, Beed"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Staff Notes & Follow-up History</label>
                <textarea
                  rows={2}
                  value={editingLead.notes || ''}
                  onChange={e => setEditingLead({ ...editingLead, notes: e.target.value })}
                  placeholder="Notes from customer calls or trial drive"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsEditLeadOpen(false); setEditingLead(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white shadow-sm"
                >
                  Save Lead Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
