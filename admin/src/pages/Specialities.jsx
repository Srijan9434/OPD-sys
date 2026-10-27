import React, { useState, useEffect } from 'react'
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  AlertCircle,
  Stethoscope,
} from 'lucide-react'
import adminApi from '../api/adminApi'
import toast from 'react-hot-toast'

export const Specialities = () => {
  const [specialities, setSpecialities] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSpec, setEditingSpec] = useState(null)

  // Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('🩺')
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchSpecialities = async () => {
    setLoading(true)
    try {
      const res = await adminApi.get('/admin/specialities')
      if (res.data?.success) {
        setSpecialities(res.data.data || [])
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load specialities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSpecialities()
  }, [])

  const handleOpenAddModal = () => {
    setEditingSpec(null)
    setName('')
    setDescription('')
    setIcon('🩺')
    setIsActive(true)
    setShowModal(true)
  }

  const handleOpenEditModal = (spec) => {
    setEditingSpec(spec)
    setName(spec.name)
    setDescription(spec.description || '')
    setIcon(spec.icon || '🩺')
    setIsActive(spec.isActive !== false)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Speciality name is required')
      return
    }

    setSubmitting(true)
    try {
      if (editingSpec) {
        const res = await adminApi.put(`/admin/specialities/${editingSpec._id}`, {
          name,
          description,
          icon,
          isActive,
        })
        if (res.data?.success) {
          toast.success('Speciality updated successfully')
          setShowModal(false)
          fetchSpecialities()
        }
      } else {
        const res = await adminApi.post('/admin/specialities', {
          name,
          description,
          icon,
        })
        if (res.data?.success) {
          toast.success('Speciality created successfully')
          setShowModal(false)
          fetchSpecialities()
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save speciality')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (spec) => {
    const actionLabel = spec.doctorCount > 0 ? 'deactivate' : 'delete'
    if (!window.confirm(`Are you sure you want to ${actionLabel} "${spec.name}"?`)) return

    try {
      const res = await adminApi.delete(`/admin/specialities/${spec._id}`)
      if (res.data?.success) {
        toast.success(res.data.message)
        fetchSpecialities()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete speciality')
    }
  }

  const filtered = specialities.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const commonIcons = ['🩺', '⚕️', '✨', '👶', '🧠', '🥗', '❤️', '🦴', '👁️', '🦷', '🔬', '💉']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Medical Specialities</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage clinical departments, categories and patient-side filters
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search specialities..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Speciality</span>
          </button>
        </div>
      </div>

      {/* Specialities Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading clinical specialities...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400">
          <Tag className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">No specialities found</p>
          <p className="text-xs text-slate-400 mt-1">Add a new speciality using the button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((spec) => (
            <div
              key={spec._id}
              className={`bg-white rounded-2xl p-5 border transition-all ${
                spec.isActive
                  ? 'border-slate-200/80 shadow-2xs hover:shadow-xs'
                  : 'border-slate-200 opacity-60 bg-slate-50/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shadow-2xs">
                  {spec.icon || '🩺'}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(spec)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                    title="Edit speciality"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(spec)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Deactivate or delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base">{spec.name}</h3>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      spec.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {spec.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-8">
                  {spec.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{spec.doctorCount || 0} Registered Doctors</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Speciality Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingSpec ? 'Edit Speciality' : 'Create New Speciality'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {editingSpec
                ? 'Update departmental category details and active status'
                : 'Add a new medical category available across all OPD registration and booking flows'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Speciality Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cardiology, Orthopaedics"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Icon / Emoji
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    maxLength={4}
                    className="w-16 text-center text-xl py-1.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-1 flex-wrap">
                    {commonIcons.map((ic) => (
                      <button
                        type="button"
                        key={ic}
                        onClick={() => setIcon(ic)}
                        className={`w-7 h-7 rounded-lg text-sm border flex items-center justify-center cursor-pointer ${
                          icon === ic ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of health conditions treated under this category..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {editingSpec && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded-md text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActiveCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Active (visible to patients and doctors)
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingSpec ? 'Update Speciality' : 'Create Speciality'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Specialities
