import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Car, Clock, Users, Plus, Calendar, ShieldCheck, 
  RotateCw, AlertTriangle, ArrowRight, DollarSign, CheckCircle2, X,
  Edit, Trash2, Shield
} from 'lucide-react';

export function BatchesView() {
  const { 
    currentUser, 
    isSuperAdmin,
    hasPermission,
    selectedBranchId, 
    branches, 
    usersList,
    apiFetch, 
    showToast 
  } = useApp();

  const instructorsList = (usersList || []).filter(u => u.role === 'instructor' || u.role === 'branch_manager' || u.role === 'super_admin');

  const [batches, setBatches] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [rotations, setRotations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [isEditBatchOpen, setIsEditBatchOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isEditVehicleOpen, setIsEditVehicleOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const [isAddRotationOpen, setIsAddRotationOpen] = useState(false);

  // Forms
  const [batchForm, setBatchForm] = useState({ name: '', time_slot: '', capacity: 4, branch_id: '', instructor_id: '' });
  const [vehicleForm, setVehicleForm] = useState({
    reg_number: '', model: 'Maruti Suzuki Brezza (Manual)', fuel_type: 'Petrol',
    insurance_expiry: '', puc_expiry: '', fitness_expiry: '', branch_id: ''
  });
  const [rotationForm, setRotationForm] = useState({
    batch_id: '', vehicle_id: '', start_date: '', end_date: '', notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const bRes = await apiFetch(`/api/batches${selectedBranchId ? `?branchId=${selectedBranchId}` : ''}`);
      if (bRes.batches) setBatches(bRes.batches);

      const vRes = await apiFetch(`/api/batches/vehicles${selectedBranchId ? `?branchId=${selectedBranchId}` : ''}`);
      if (vRes.vehicles) setVehicles(vRes.vehicles);

      const rRes = await apiFetch(`/api/batches/rotations${selectedBranchId ? `?branchId=${selectedBranchId}` : ''}`);
      if (rRes.rotations) setRotations(rRes.rotations);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranchId]);

  // Submit New Batch Slot
  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/batches', {
        method: 'POST',
        body: JSON.stringify({
          ...batchForm,
          branch_id: batchForm.branch_id || selectedBranchId || branches[0]?.id
        })
      });
      showToast('Batch slot added successfully!');
      setIsAddBatchOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Open Edit Batch
  const handleOpenEditBatch = (batch) => {
    setEditingBatch({
      id: batch.id,
      name: batch.name,
      time_slot: batch.time_slot,
      capacity: batch.capacity,
      instructor_id: batch.instructor_id || '',
      is_active: batch.is_active !== undefined ? batch.is_active : 1,
      branch_id: batch.branch_id
    });
    setIsEditBatchOpen(true);
  };

  // Submit Edit Batch
  const handleSubmitEditBatch = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/batches/${editingBatch.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingBatch)
      });
      showToast('Batch slot updated successfully!');
      setIsEditBatchOpen(false);
      setEditingBatch(null);
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Batch
  const handleDeleteBatch = async (batch) => {
    const isMaster = isSuperAdmin ? ' [MASTER DELETE: Super Admin]' : '';
    if (!window.confirm(`Are you sure you want to delete batch slot "${batch.name}" (${batch.time_slot})?${isMaster}\n\nAll currently assigned students will be unassigned from this slot.`)) return;
    try {
      await apiFetch(`/api/batches/${batch.id}`, { method: 'DELETE' });
      showToast('Batch slot deleted.');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Submit New Vehicle
  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/batches/vehicles', {
        method: 'POST',
        body: JSON.stringify({
          ...vehicleForm,
          branch_id: vehicleForm.branch_id || selectedBranchId || branches[0]?.id
        })
      });
      showToast('New vehicle registered in fleet!');
      setIsAddVehicleOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Open Edit Vehicle
  const handleOpenEditVehicle = (vehicle) => {
    setEditingVehicle({
      id: vehicle.id,
      reg_number: vehicle.reg_number,
      model: vehicle.model,
      fuel_type: vehicle.fuel_type,
      insurance_expiry: vehicle.insurance_expiry || '',
      puc_expiry: vehicle.puc_expiry || '',
      fitness_expiry: vehicle.fitness_expiry || '',
      status: vehicle.status || 'Active',
      branch_id: vehicle.branch_id
    });
    setIsEditVehicleOpen(true);
  };

  // Submit Edit Vehicle
  const handleSubmitEditVehicle = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/batches/vehicles/${editingVehicle.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingVehicle)
      });
      showToast('Vehicle details updated successfully!');
      setIsEditVehicleOpen(false);
      setEditingVehicle(null);
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Vehicle
  const handleDeleteVehicle = async (vehicle) => {
    const isMaster = isSuperAdmin ? ' [MASTER DELETE: Super Admin]' : '';
    if (!window.confirm(`Are you sure you want to delete vehicle "${vehicle.model} (${vehicle.reg_number})"?${isMaster}\n\nAny rotation schedules for this vehicle will also be unlinked.`)) return;
    try {
      await apiFetch(`/api/batches/vehicles/${vehicle.id}`, { method: 'DELETE' });
      showToast('Vehicle removed from fleet.');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Submit Rotation Schedule
  const handleCreateRotation = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/batches/rotations', {
        method: 'POST',
        body: JSON.stringify(rotationForm)
      });
      showToast('Vehicle rotation schedule assigned!');
      setIsAddRotationOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Rotation Schedule
  const handleDeleteRotation = async (rotation) => {
    const isMaster = isSuperAdmin ? ' [MASTER DELETE: Super Admin]' : '';
    if (!window.confirm(`Delete rotation schedule for "${rotation.vehicle_model}" (${rotation.batch_name})?${isMaster}`)) return;
    try {
      await apiFetch(`/api/batches/rotations/${rotation.id}`, { method: 'DELETE' });
      showToast('Rotation entry removed.');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Batch Slots & Rotational Fleet Management</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
              {batches.length} Slots Active
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Module 5: 1-hour slot capacity caps, instructor continuity pairing, and weekly vehicle wear-balancing rotation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsAddRotationOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Schedule Rotation</span>
          </button>
          <button
            onClick={() => setIsAddVehicleOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Vehicle</span>
          </button>
          <button
            onClick={() => setIsAddBatchOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Batch Slot</span>
          </button>
        </div>
      </div>

      {/* 1. Batch Slots Capacity Grid */}
      <div>
        <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>1-Hour Batch Slots & Capacity Caps (Max 4 Students)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map(batch => {
            const isFull = batch.enrolled_count >= batch.capacity;
            const pct = Math.min(100, Math.round((batch.enrolled_count / batch.capacity) * 100));

            return (
              <div key={batch.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {batch.time_slot}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isFull ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isFull ? 'Capacity Full' : `${batch.capacity - batch.enrolled_count} Open`}
                      </span>
                      <div className="flex items-center gap-0.5 ml-1">
                        {(isSuperAdmin || hasPermission('manage_batches')) && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditBatch(batch)}
                            className="p-1 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50"
                            title={isSuperAdmin ? "Master Edit Batch Slot (Super Admin)" : "Edit Batch Slot"}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(isSuperAdmin || hasPermission('delete_batches') || hasPermission('manage_batches')) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteBatch(batch)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title={isSuperAdmin ? "Master Delete Batch Slot (Super Admin)" : "Delete Batch Slot"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 mt-2">{batch.name}</h4>
                  <div className="text-xs text-slate-500 mt-0.5">{batch.branch_name}</div>

                  {/* Assigned Driving Instructor */}
                  <div className="mt-2.5 p-2 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-950 font-semibold min-w-0">
                      <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider leading-none">Batch Instructor</div>
                        <span className="truncate block mt-0.5 font-bold text-slate-800">
                          {batch.instructor_name || 'No Instructor Assigned'}
                        </span>
                      </div>
                    </div>
                    {(isSuperAdmin || hasPermission('manage_batches')) && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditBatch(batch)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-white px-2 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors shrink-0 ml-2"
                      >
                        {batch.instructor_name ? 'Change' : 'Assign'}
                      </button>
                    )}
                  </div>

                  {/* Active Vehicle Rotation Tag */}
                  <div className="mt-3 p-2 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-blue-900 font-semibold">
                      <Car className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="truncate">{batch.active_vehicle_model || 'Maruti Suzuki Brezza'}</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                      {batch.active_vehicle_reg || 'Rotated'}
                    </span>
                  </div>

                  {/* Enrolled Students Capacity Meter */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-600 font-semibold mb-1">
                      <span>Enrolled Capacity</span>
                      <span>{batch.enrolled_count} / {batch.capacity} Students</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          isFull ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Enrolled Students Quick List */}
                {batch.students?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Trainees</div>
                    {batch.students.map(s => (
                      <div key={s.id} className="text-xs text-slate-700 flex justify-between items-center">
                        <span className="font-medium truncate">{s.name}</span>
                        <span className="text-[11px] font-mono text-slate-500">Day {s.days_completed}/{s.total_course_days}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Rotational Fleet Schedule Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-indigo-600" />
              <span>Rotational Fleet Schedule (5–7 Day Wear Management)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated vehicle swaps across time slots to balance mileage, tyre wear, and maintenance intervals.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Batch Slot</th>
                <th className="py-2.5 px-3">Assigned Training Car</th>
                <th className="py-2.5 px-3">Start Date</th>
                <th className="py-2.5 px-3">End Date</th>
                <th className="py-2.5 px-3">Rotation Notes</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rotations.map(rot => (
                <tr key={rot.id}>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{rot.batch_name} ({rot.batch_time_slot})</td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-blue-700">{rot.vehicle_model}</span>
                    <span className="ml-1.5 font-mono text-slate-500 text-[11px] bg-slate-100 px-1 py-0.5 rounded">
                      {rot.vehicle_reg}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{rot.start_date}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{rot.end_date}</td>
                  <td className="py-2.5 px-3 text-slate-500">{rot.notes || 'Weekly balance rotation'}</td>
                  <td className="py-2.5 px-3 text-right">
                    {(isSuperAdmin || hasPermission('delete_rotations') || hasPermission('manage_rotations') || hasPermission('manage_batches')) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRotation(rot)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title={isSuperAdmin ? "Master Delete Rotation (Super Admin)" : "Delete Rotation"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {rotations.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400">No rotation records scheduled yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Training Fleet Inventory & Vehicle P&L */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
          <Car className="w-4 h-4 text-emerald-600" />
          <span>Vehicle Fleet Inventory & Operational P&L</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {vehicles.map(v => (
            <div key={v.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {v.reg_number}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800">
                      {v.status}
                    </span>
                    <div className="flex items-center gap-0.5 ml-1">
                      {(isSuperAdmin || hasPermission('manage_vehicles')) && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditVehicle(v)}
                          className="p-1 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-white"
                          title={isSuperAdmin ? "Master Edit Vehicle (Super Admin)" : "Edit Vehicle"}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(isSuperAdmin || hasPermission('delete_vehicles') || hasPermission('manage_vehicles')) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteVehicle(v)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white"
                          title={isSuperAdmin ? "Master Delete Vehicle (Super Admin)" : "Delete Vehicle"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-slate-900 mt-2">{v.model}</h4>
                <div className="text-xs text-slate-500 mt-0.5">{v.branch_name} • {v.fuel_type}</div>

                {/* Expiry alerts */}
                <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                  <div className="flex justify-between">
                    <span>Insurance Expiry:</span>
                    <strong className="text-slate-700 font-mono">{v.insurance_expiry || 'Active'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>PUC Expiry:</span>
                    <strong className="text-slate-700 font-mono">{v.puc_expiry || 'Active'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Fitness Expiry:</span>
                    <strong className="text-slate-700 font-mono">{v.fitness_expiry || 'Active'}</strong>
                  </div>
                </div>
              </div>

              {/* Vehicle Operational Costs */}
              <div className="mt-4 pt-3 border-t border-slate-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Fuel & Repairs:</span>
                  <strong className="text-rose-600 font-mono font-bold">
                    ₹{(v.total_operational_cost || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add Batch Slot */}
      {isAddBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Add 1-Hour Batch Slot</h3>
              <button onClick={() => setIsAddBatchOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateBatch} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Batch Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Early Bird Slot"
                  value={batchForm.name}
                  onChange={e => setBatchForm({ ...batchForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">1-Hour Time Slot (e.g. 06:00 AM - 07:00 AM) *</label>
                <input
                  type="text"
                  placeholder="06:00 AM - 07:00 AM"
                  value={batchForm.time_slot}
                  onChange={e => setBatchForm({ ...batchForm, time_slot: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student Capacity Cap (Default: 4)</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={batchForm.capacity}
                  onChange={e => setBatchForm({ ...batchForm, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Driving Instructor</label>
                <select
                  value={batchForm.instructor_id || ''}
                  onChange={e => setBatchForm({ ...batchForm, instructor_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                >
                  <option value="">-- No Instructor Assigned --</option>
                  {instructorsList.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role.replace('_', ' ')})</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Students enrolled in this batch will automatically learn under this instructor.</p>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddBatchOpen(false)} className="px-3 py-2 rounded-xl text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl">Create Batch Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Vehicle */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Add Fleet Vehicle</h3>
              <button onClick={() => setIsAddVehicleOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateVehicle} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registration Number (e.g. MH-23-AJ-1024) *</label>
                <input
                  type="text"
                  placeholder="MH-23-XX-0000"
                  value={vehicleForm.reg_number}
                  onChange={e => setVehicleForm({ ...vehicleForm, reg_number: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono uppercase"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Car Model & Transmission *</label>
                <input
                  type="text"
                  placeholder="e.g. Maruti Suzuki Brezza (Manual)"
                  value={vehicleForm.model}
                  onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Insurance Expiry</label>
                  <input
                    type="date"
                    value={vehicleForm.insurance_expiry}
                    onChange={e => setVehicleForm({ ...vehicleForm, insurance_expiry: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PUC Expiry</label>
                  <input
                    type="date"
                    value={vehicleForm.puc_expiry}
                    onChange={e => setVehicleForm({ ...vehicleForm, puc_expiry: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddVehicleOpen(false)} className="px-3 py-2 rounded-xl text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl">Register Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Rotation */}
      {isAddRotationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Schedule Fleet Rotation</h3>
              <button onClick={() => setIsAddRotationOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateRotation} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Batch Slot *</label>
                <select
                  value={rotationForm.batch_id}
                  onChange={e => setRotationForm({ ...rotationForm, batch_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  required
                >
                  <option value="">Select slot...</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.time_slot})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Fleet Vehicle *</label>
                <select
                  value={rotationForm.vehicle_id}
                  onChange={e => setRotationForm({ ...rotationForm, vehicle_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  required
                >
                  <option value="">Select vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.model} ({v.reg_number})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rotation Start *</label>
                  <input
                    type="date"
                    value={rotationForm.start_date}
                    onChange={e => setRotationForm({ ...rotationForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rotation End *</label>
                  <input
                    type="date"
                    value={rotationForm.end_date}
                    onChange={e => setRotationForm({ ...rotationForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rotation Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly wear rotation for Brezza"
                  value={rotationForm.notes}
                  onChange={e => setRotationForm({ ...rotationForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddRotationOpen(false)} className="px-3 py-2 rounded-xl text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl">Assign Rotation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Batch Slot */}
      {isEditBatchOpen && editingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                  <Edit className="w-4 h-4 text-amber-600" />
                  <span>Edit Batch Slot</span>
                </h3>
                {isSuperAdmin && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mt-1 inline-block border border-amber-200">
                    Super Admin Master Authority
                  </span>
                )}
              </div>
              <button 
                type="button"
                onClick={() => { setIsEditBatchOpen(false); setEditingBatch(null); }}
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditBatch} className="space-y-3.5 text-xs">
              {isSuperAdmin && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch</label>
                  <select
                    value={editingBatch.branch_id}
                    onChange={e => setEditingBatch({ ...editingBatch, branch_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Batch Label *</label>
                <input
                  type="text"
                  placeholder="e.g. Morning Batch A"
                  value={editingBatch.name}
                  onChange={e => setEditingBatch({ ...editingBatch, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">1-Hour Time Window *</label>
                <input
                  type="text"
                  placeholder="06:00 AM - 07:00 AM"
                  value={editingBatch.time_slot}
                  onChange={e => setEditingBatch({ ...editingBatch, time_slot: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacity Cap</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editingBatch.capacity}
                    onChange={e => setEditingBatch({ ...editingBatch, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingBatch.is_active ? 1 : 0}
                    onChange={e => setEditingBatch({ ...editingBatch, is_active: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Driving Instructor</label>
                <select
                  value={editingBatch.instructor_id || ''}
                  onChange={e => setEditingBatch({ ...editingBatch, instructor_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="">-- No Instructor Assigned --</option>
                  {instructorsList.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role.replace('_', ' ')})</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Students enrolled in this batch will automatically learn under this instructor.</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => { setIsEditBatchOpen(false); setEditingBatch(null); }} 
                  className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Batch Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Vehicle */}
      {isEditVehicleOpen && editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                  <Edit className="w-4 h-4 text-amber-600" />
                  <span>Edit Fleet Vehicle</span>
                </h3>
                {isSuperAdmin && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mt-1 inline-block border border-amber-200">
                    Super Admin Master Authority
                  </span>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => { setIsEditVehicleOpen(false); setEditingVehicle(null); }}
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditVehicle} className="space-y-3.5 text-xs">
              {isSuperAdmin && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch</label>
                  <select
                    value={editingVehicle.branch_id}
                    onChange={e => setEditingVehicle({ ...editingVehicle, branch_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Registration No *</label>
                  <input
                    type="text"
                    required
                    value={editingVehicle.reg_number}
                    onChange={e => setEditingVehicle({ ...editingVehicle, reg_number: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vehicle Status</label>
                  <select
                    value={editingVehicle.status}
                    onChange={e => setEditingVehicle({ ...editingVehicle, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vehicle Model *</label>
                  <input
                    type="text"
                    required
                    value={editingVehicle.model}
                    onChange={e => setEditingVehicle({ ...editingVehicle, model: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fuel Type</label>
                  <select
                    value={editingVehicle.fuel_type}
                    onChange={e => setEditingVehicle({ ...editingVehicle, fuel_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-600">Compliance & Expiry Dates</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Insurance</label>
                    <input
                      type="date"
                      value={editingVehicle.insurance_expiry}
                      onChange={e => setEditingVehicle({ ...editingVehicle, insurance_expiry: e.target.value })}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">PUC Expiry</label>
                    <input
                      type="date"
                      value={editingVehicle.puc_expiry}
                      onChange={e => setEditingVehicle({ ...editingVehicle, puc_expiry: e.target.value })}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Fitness</label>
                    <input
                      type="date"
                      value={editingVehicle.fitness_expiry}
                      onChange={e => setEditingVehicle({ ...editingVehicle, fitness_expiry: e.target.value })}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => { setIsEditVehicleOpen(false); setEditingVehicle(null); }} 
                  className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Vehicle Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
