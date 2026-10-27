import React, { useState, useEffect } from 'react'
import {
  Users,
  Search,
  RefreshCw,
  Plus,
  Lock,
  Unlock,
  Calendar,
  Phone,
  Mail,
  Eye,
  FileText,
  Clock,
  ShieldAlert,
} from 'lucide-react'
import adminApi from '../api/adminApi'
import toast from 'react-hot-toast'

export const Patients = () => {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientAppointments, setPatientAppointments] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Add Patient Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    gender: 'Male',
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchPatients = async (query = '') => {
    setLoading(true)
    try {
      const url = query ? `/admin/patients?q=${encodeURIComponent(query)}` : '/admin/patients'
      const res = await adminApi.get(url)
      if (res.data?.success) {
        setPatients(res.data.data || [])
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error loading patients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchPatients(searchQuery)
  }

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      age: '',
      gender: 'Male',
    })
    setShowAddModal(true)
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Name, email and password are required')
      return
    }

    setSubmitting(true)
    try {
      const res = await adminApi.post('/admin/patients', formData)
      if (res.data?.success) {
        toast.success(`Patient ${formData.name} registered successfully`)
        setShowAddModal(false)
        fetchPatients(searchQuery)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register patient')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (patient) => {
    const isCurrentlyBlocked = patient.isBlocked
    const confirmMsg = isCurrentlyBlocked
      ? `Re-activate account for ${patient.name}?`
      : `Deactivate account for ${patient.name}? The patient will be blocked from logging in.`

    if (!window.confirm(confirmMsg)) return

    try {
      const res = await adminApi.put(`/admin/patients/${patient._id}/status`)
      if (res.data?.success) {
        toast.success(res.data.message)
        fetchPatients(searchQuery)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update patient status')
    }
  }

  const handleViewDetails = async (patient) => {
    setSelectedPatient(patient)
    setShowDetailsModal(true)
    setLoadingDetails(true)
    try {
      const res = await adminApi.get(`/admin/patients/${patient._id}`)
      if (res.data?.success) {
        setSelectedPatient(res.data.data.patient)
        setPatientAppointments(res.data.data.appointments || [])
      }
    } catch {
      toast.error('Failed to load patient medical records')
    } finally {
      setLoadingDetails(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Registered Patients</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Directory of patient records, historical appointments, and account management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, email, phone..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer shrink-0"
            >
              Search
            </button>
          </form>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Patient</span>
          </button>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading patients from database...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No patients found</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery ? 'Try clearing your search query.' : 'Register a patient manually using the button above.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Patient</th>
                  <th className="py-3 px-6">Contact Info</th>
                  <th className="py-3 px-6">Age / Gender</th>
                  <th className="py-3 px-6">Registered On</th>
                  <th className="py-3 px-6">Account Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {patients.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm shrink-0">
                          {p.name?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">ID: {p._id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{p.email}</span>
                        </div>
                        {p.phone && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{p.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      <span>{p.age ? `${p.age} yrs` : '—'}</span>
                      <span className="text-slate-300 mx-1.5">|</span>
                      <span>{p.gender || 'Not specified'}</span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          p.isBlocked
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {p.isBlocked ? 'Deactivated' : 'Active'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewDetails(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="View patient history"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            p.isBlocked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-rose-600 hover:bg-rose-50'
                          }`}
                          title={p.isBlocked ? 'Activate account' : 'Deactivate account'}
                        >
                          {p.isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD PATIENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Register New Patient</h3>
            <p className="text-xs text-slate-500 mb-5">
              Create an official OPD patient account for appointment scheduling
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Verma"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="rahul.verma@example.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Initial Password * (min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Age
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="28"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Registering...' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PATIENT DETAILS & APPOINTMENT HISTORY MODAL */}
      {showDetailsModal && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-base">
                  {selectedPatient.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedPatient.name}</h3>
                  <p className="text-xs text-slate-400">
                    {selectedPatient.email} {selectedPatient.phone ? `• ${selectedPatient.phone}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Vitals Summary */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Age</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.age || '—'} yrs</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Gender</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.gender || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Account</span>
                  <span className={`font-semibold ${selectedPatient.isBlocked ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {selectedPatient.isBlocked ? 'Deactivated' : 'Active'}
                  </span>
                </div>
              </div>

              {/* Consultation Records */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Appointment History ({patientAppointments.length})
                </h4>
                {loadingDetails ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading history...</div>
                ) : patientAppointments.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No recorded appointments for this patient yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {patientAppointments.map((apt) => (
                      <div
                        key={apt._id}
                        className="p-3 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-colors text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">
                            Dr. {apt.doctor?.name || 'Assigned Physician'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700">
                            {apt.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          📅 {apt.date} at {apt.slot} • {apt.doctor?.speciality}
                        </p>
                        {apt.reason && (
                          <p className="text-slate-600 mt-1.5 italic bg-slate-50/70 p-2 rounded-lg text-[11px]">
                            "{apt.reason}"
                          </p>
                        )}
                        {apt.prescription?.diagnosis && (
                          <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-emerald-800 bg-emerald-50/50 p-2 rounded-lg">
                            <span className="font-bold">Diagnosis: </span>
                            {apt.prescription.diagnosis}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Patients
