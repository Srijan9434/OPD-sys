import React, { useState, useEffect } from 'react'
import {
  Stethoscope,
  Search,
  RefreshCw,
  Plus,
  Edit2,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  DollarSign,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Eye,
} from 'lucide-react'
import adminApi from '../api/adminApi'
import toast from 'react-hot-toast'

export const Doctors = () => {
  const [doctors, setDoctors] = useState([])
  const [specialities, setSpecialities] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpeciality, setSelectedSpeciality] = useState('All')

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState(null)
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false)
  const [selectedDoctorAppointments, setSelectedDoctorAppointments] = useState([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [selectedDoctorName, setSelectedDoctorName] = useState('')

  // Add / Edit Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    speciality: '',
    degree: 'MBBS, MD',
    experience: '5 Years',
    fee: 500,
    about: '',
    image: '',
    slots: [
      '8:00 am',
      '8:30 am',
      '9:00 am',
      '9:30 am',
      '10:00 am',
      '10:30 am',
      '11:00 am',
      '11:30 am',
    ],
  })
  const [submitting, setSubmitting] = useState(false)

  const defaultAllSlots = [
    '8:00 am', '8:30 am', '9:00 am', '9:30 am',
    '10:00 am', '10:30 am', '11:00 am', '11:30 am',
    '2:00 pm', '2:30 pm', '3:00 pm', '3:30 pm',
    '4:00 pm', '4:30 pm', '5:00 pm', '5:30 pm',
  ]

  const fetchDoctors = async (query = '', spec = 'All') => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.append('q', query)
      if (spec && spec !== 'All') params.append('speciality', spec)

      const res = await adminApi.get(`/admin/doctors?${params.toString()}`)
      if (res.data?.success) {
        setDoctors(res.data.data || [])
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error loading doctors')
    } finally {
      setLoading(false)
    }
  }

  const fetchSpecialities = async () => {
    try {
      const res = await adminApi.get('/admin/specialities')
      if (res.data?.success) {
        setSpecialities(res.data.data.map((s) => s.name))
      }
    } catch {
      // Fallback
      setSpecialities([
        'General physician',
        'Gynecologist',
        'Dermatologist',
        'Pediatricians',
        'Neurologist',
        'Gastroenterologist',
        'Cardiology',
        'Orthopaedics',
      ])
    }
  }

  useEffect(() => {
    fetchSpecialities()
  }, [])

  useEffect(() => {
    fetchDoctors(searchQuery, selectedSpeciality)
  }, [selectedSpeciality])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchDoctors(searchQuery, selectedSpeciality)
  }

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      speciality: specialities[0] || 'General physician',
      degree: 'MBBS, MD',
      experience: '5 Years',
      fee: 500,
      about: '',
      image: '',
      slots: [
        '8:00 am', '8:30 am', '9:00 am', '9:30 am',
        '10:00 am', '10:30 am', '11:00 am', '11:30 am',
      ],
    })
    setShowAddModal(true)
  }

  const handleOpenEditModal = (doc) => {
    setEditingDoctor(doc)
    setFormData({
      name: doc.name,
      email: doc.user?.email || '',
      phone: doc.user?.phone || '',
      speciality: doc.speciality,
      degree: doc.degree || 'MBBS',
      experience: doc.experience || '1 Year',
      fee: doc.fee || 500,
      about: doc.about || '',
      image: doc.image || '',
      slots: Array.isArray(doc.slots) && doc.slots.length > 0 ? doc.slots : defaultAllSlots.slice(0, 8),
    })
    setShowEditModal(true)
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.password || !formData.speciality) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const res = await adminApi.post('/admin/doctors', formData)
      if (res.data?.success) {
        toast.success(`Dr. ${formData.name} registered successfully!`)
        setShowAddModal(false)
        fetchDoctors(searchQuery, selectedSpeciality)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register doctor')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await adminApi.put(`/admin/doctors/${editingDoctor._id}`, formData)
      if (res.data?.success) {
        toast.success('Doctor profile updated successfully')
        setShowEditModal(false)
        fetchDoctors(searchQuery, selectedSpeciality)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update doctor')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (doc) => {
    const isCurrentlyBlocked = doc.user?.isBlocked
    const confirmMsg = isCurrentlyBlocked
      ? `Re-activate Dr. ${doc.name}'s account and allow booking?`
      : `Deactivate Dr. ${doc.name}'s account? This will pause all patient bookings.`

    if (!window.confirm(confirmMsg)) return

    try {
      const res = await adminApi.put(`/admin/doctors/${doc._id}/status`)
      if (res.data?.success) {
        toast.success(res.data.message)
        fetchDoctors(searchQuery, selectedSpeciality)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update doctor status')
    }
  }

  const handleViewAppointments = async (doc) => {
    setSelectedDoctorName(doc.name)
    setShowAppointmentsModal(true)
    setLoadingAppointments(true)
    try {
      const res = await adminApi.get(`/admin/appointments?doctorId=${doc._id}`)
      if (res.data?.success) {
        setSelectedDoctorAppointments(res.data.data || [])
      }
    } catch {
      toast.error('Failed to load appointments for this doctor')
    } finally {
      setLoadingAppointments(false)
    }
  }

  const toggleSlotSelection = (slot) => {
    setFormData((prev) => {
      const current = prev.slots || []
      if (current.includes(slot)) {
        return { ...prev, slots: current.filter((s) => s !== slot) }
      } else {
        return { ...prev, slots: [...current, slot] }
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Doctors & Medical Specialists</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Register new practitioners, configure consult fees, slots, and account access
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
                placeholder="Search doctors..."
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
            <span>Add Doctor</span>
          </button>
        </div>
      </div>

      {/* Speciality Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedSpeciality('All')}
          className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors cursor-pointer ${
            selectedSpeciality === 'All'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Specialities
        </button>
        {specialities.map((spec) => (
          <button
            key={spec}
            onClick={() => setSelectedSpeciality(spec)}
            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedSpeciality === spec
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {spec}
          </button>
        ))}
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading medical staff from database...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Stethoscope className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No doctors found</p>
            <p className="text-xs text-slate-400 mt-1">
              Click "Add Doctor" above to register a new physician into the hospital system.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Doctor</th>
                  <th className="py-3 px-6">Speciality & Degree</th>
                  <th className="py-3 px-6">Experience & Fee</th>
                  <th className="py-3 px-6">Availability</th>
                  <th className="py-3 px-6">Account Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {doctors.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-800">
                      <div className="flex items-center gap-3">
                        <img
                          src={doc.image || '/doctors/doc1.png'}
                          alt={doc.name}
                          onError={(e) => {
                            e.target.src =
                              'https://ui-avatars.com/api/?name=' +
                              encodeURIComponent(doc.name) +
                              '&background=5f6fff&color=fff'
                          }}
                          className="w-10 h-10 rounded-full object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{doc.name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {doc.user?.email || 'No email'}
                            </span>
                            {doc.user?.phone && (
                              <span className="flex items-center gap-1 font-mono">
                                • {doc.user.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-700">
                      <div>
                        <p className="font-semibold text-indigo-600">{doc.speciality}</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">{doc.degree || 'MBBS'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      <div>
                        <p className="font-semibold text-slate-900">₹{doc.fee}</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">{doc.experience || '1 Year'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          doc.available
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            doc.available ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span>{doc.available ? 'Available' : 'Unavailable'}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          doc.user?.isBlocked
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {doc.user?.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewAppointments(doc)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="View doctor's appointments"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(doc)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Edit profile & slots"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(doc)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            doc.user?.isBlocked
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-rose-600 hover:bg-rose-50'
                          }`}
                          title={doc.user?.isBlocked ? 'Activate account' : 'Deactivate account'}
                        >
                          {doc.user?.isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
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

      {/* ADD DOCTOR MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 my-8">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Register New Doctor</h3>
            <p className="text-xs text-slate-500 mb-5">
              Creates login credentials for the doctor portal and clinical public profile together
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Rohit Kumar"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Doctor Email (Login ID) *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="dr.rohit@opd.local"
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
                    Speciality Department *
                  </label>
                  <select
                    value={formData.speciality}
                    onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {specialities.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Qualifications / Degree
                  </label>
                  <input
                    type="text"
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    placeholder="MBBS, MD, MS"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Years of Experience
                  </label>
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="e.g. 5 Years"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Consultation Fee (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: Number(e.target.value) })}
                    placeholder="600"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Profile Photo URL (optional)
                </label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="/doctors/doc1.png or https://..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  About / Bio
                </label>
                <textarea
                  rows={2}
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  placeholder="Doctor's background, clinical interests, and hospital affiliations..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Available Consultation Slots ({formData.slots.length} selected)
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {defaultAllSlots.map((slot) => {
                    const isSelected = formData.slots.includes(slot)
                    return (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => toggleSlotSelection(slot)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>
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
                  {submitting ? 'Registering Doctor...' : 'Register Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DOCTOR MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 my-8">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Edit Doctor Profile</h3>
            <p className="text-xs text-slate-500 mb-5">
              Modify clinical parameters, fees, and available daily slots for Dr. {formData.name}
            </p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Doctor Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Speciality Department
                  </label>
                  <select
                    value={formData.speciality}
                    onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {specialities.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Consultation Fee (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Qualifications
                  </label>
                  <input
                    type="text"
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Experience
                  </label>
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  About / Bio
                </label>
                <textarea
                  rows={2}
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Configure Available Slots ({formData.slots.length} selected)
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {defaultAllSlots.map((slot) => {
                    const isSelected = formData.slots.includes(slot)
                    return (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => toggleSlotSelection(slot)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Update Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCTOR APPOINTMENTS MODAL */}
      {showAppointmentsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Appointment Bookings — {selectedDoctorName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Patient consult queue and historical records for this physician
                </p>
              </div>
              <button
                onClick={() => setShowAppointmentsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {loadingAppointments ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading appointments...</div>
              ) : selectedDoctorAppointments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No appointments registered for this doctor.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase font-semibold">
                      <th className="py-2.5 px-4">Patient</th>
                      <th className="py-2.5 px-4">Date & Slot</th>
                      <th className="py-2.5 px-4">Reason</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedDoctorAppointments.map((apt) => (
                      <tr key={apt._id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {apt.patient?.name || 'Unknown'}
                          <span className="block text-[11px] text-slate-400 font-normal">{apt.patient?.email}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {apt.date} • {apt.slot}
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                          {apt.reason || 'General'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full font-semibold capitalize bg-indigo-50 text-indigo-700">
                            {apt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowAppointmentsModal(false)}
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

export default Doctors
