import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  CalendarRange,
  Ban,
  User,
  Stethoscope,
} from 'lucide-react'
import adminApi from '../api/adminApi'
import toast from 'react-hot-toast'

export const Appointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)

  // Reschedule state
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleSlot, setRescheduleSlot] = useState('')
  const [bookedSlots, setBookedSlots] = useState([])
  const [submittingAction, setSubmittingAction] = useState(false)

  // Cancel state
  const [cancelReason, setCancelReason] = useState('')

  const statusTabs = [
    { label: 'All Bookings', value: 'all' },
    { label: 'Waiting Queue', value: 'waiting' },
    { label: 'In-Consultation', value: 'in-consultation' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ]

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      if (dateFilter) params.append('date', dateFilter)
      if (searchQuery) params.append('q', searchQuery)

      const res = await adminApi.get(`/admin/appointments?${params.toString()}`)
      if (res.data?.success) {
        setAppointments(res.data.data || [])
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error loading appointments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [statusFilter, dateFilter])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchAppointments()
  }

  const handleOpenReschedule = async (apt) => {
    setSelectedAppointment(apt)
    setRescheduleDate(apt.date)
    setRescheduleSlot(apt.slot)
    setShowRescheduleModal(true)

    // Load booked slots for that doctor and date
    try {
      const res = await adminApi.get(`/appointments/booked-slots/${apt.doctor?._id}?date=${apt.date}`)
      if (res.data?.success) {
        setBookedSlots(res.data.bookedSlots || [])
      }
    } catch {
      setBookedSlots([])
    }
  }

  const handleRescheduleDateChange = async (newDate) => {
    setRescheduleDate(newDate)
    if (selectedAppointment?.doctor?._id && newDate) {
      try {
        const res = await adminApi.get(`/appointments/booked-slots/${selectedAppointment.doctor._id}?date=${newDate}`)
        if (res.data?.success) {
          setBookedSlots(res.data.bookedSlots || [])
        }
      } catch {
        setBookedSlots([])
      }
    }
  }

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault()
    if (!rescheduleDate || !rescheduleSlot) {
      toast.error('Date and slot are required')
      return
    }

    setSubmittingAction(true)
    try {
      const res = await adminApi.put(`/admin/appointments/${selectedAppointment._id}/reschedule`, {
        date: rescheduleDate,
        slot: rescheduleSlot,
      })
      if (res.data?.success) {
        toast.success('Appointment rescheduled successfully')
        setShowRescheduleModal(false)
        fetchAppointments()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reschedule appointment')
    } finally {
      setSubmittingAction(false)
    }
  }

  const handleOpenCancel = (apt) => {
    setSelectedAppointment(apt)
    setCancelReason('')
    setShowCancelModal(true)
  }

  const handleCancelSubmit = async (e) => {
    e.preventDefault()
    setSubmittingAction(true)
    try {
      const res = await adminApi.put(`/admin/appointments/${selectedAppointment._id}/cancel`, {
        reason: cancelReason || 'Administrative cancellation',
      })
      if (res.data?.success) {
        toast.success('Appointment cancelled')
        setShowCancelModal(false)
        fetchAppointments()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment')
    } finally {
      setSubmittingAction(false)
    }
  }

  const handleOpenPrescription = (apt) => {
    setSelectedAppointment(apt)
    setShowPrescriptionModal(true)
  }

  const handlePrintPrescription = () => {
    window.print()
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'waiting':
        return 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse'
      case 'in-consultation':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold'
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'completed':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'cancelled':
      case 'rejected':
      case 'doctor-unavailable':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200'
    }
  }

  const availableSlotsList = [
    '8:00 am', '8:30 am', '9:00 am', '9:30 am',
    '10:00 am', '10:30 am', '11:00 am', '11:30 am',
    '2:00 pm', '2:30 pm', '3:00 pm', '3:30 pm',
    '4:00 pm', '4:30 pm', '5:00 pm', '5:30 pm',
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Hospital Appointments</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time consultation master queue, conflict scheduling, and prescription audit
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-indigo-600 font-semibold px-2 py-1 hover:underline cursor-pointer"
            >
              Clear Date
            </button>
          )}

          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, doctor..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3 overflow-x-auto text-xs">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === tab.value
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading appointments from database...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No appointments found</p>
            <p className="text-xs text-slate-400 mt-1">
              No appointments matching status "{statusFilter}" in the database.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Patient</th>
                  <th className="py-3 px-6">Doctor</th>
                  <th className="py-3 px-6">Date & Slot</th>
                  <th className="py-3 px-6">Reason / Symptoms</th>
                  <th className="py-3 px-6">Payment</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {appointments.map((apt) => (
                  <tr key={apt._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-800">
                      <div>
                        <p className="font-semibold text-slate-900">{apt.patient?.name || 'Unknown Patient'}</p>
                        <p className="text-xs text-slate-400">{apt.patient?.email || 'No email'}</p>
                        {apt.patient?.phone && (
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{apt.patient.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <div>
                        <p className="font-semibold text-slate-900">{apt.doctor?.name || 'Unknown Doctor'}</p>
                        <p className="text-xs text-indigo-600 font-medium">{apt.doctor?.speciality || 'General'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <div className="text-xs">
                        <span className="font-semibold text-slate-800 block">{apt.date}</span>
                        <span className="text-slate-500 font-mono mt-0.5 inline-block">{apt.slot}</span>
                        {apt.rescheduledFrom?.date && (
                          <span className="block text-[10px] text-amber-600 mt-0.5">
                            Rescheduled from {apt.rescheduledFrom.date}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-xs max-w-xs">
                      <p className="truncate font-medium text-slate-800">{apt.reason || 'General Consultation'}</p>
                      {apt.cancelReason && (
                        <p className="text-[11px] text-rose-600 mt-0.5">Note: {apt.cancelReason}</p>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="capitalize font-medium text-slate-700">
                            {apt.payment?.mode || 'cash'}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-semibold text-slate-900">
                            ₹{apt.payment?.amount || apt.doctor?.fee || 0}
                          </span>
                        </div>
                        <span
                          className={`inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-sm ${
                            apt.payment?.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {apt.payment?.status || 'pending'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize ${getStatusBadge(
                          apt.status
                        )}`}
                      >
                        {apt.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {apt.prescription?.diagnosis && (
                          <button
                            onClick={() => handleOpenPrescription(apt)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="View / Print Prescription"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}

                        {!['completed', 'cancelled', 'rejected'].includes(apt.status) && (
                          <>
                            <button
                              onClick={() => handleOpenReschedule(apt)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Reschedule appointment"
                            >
                              <CalendarRange className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenCancel(apt)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Cancel appointment"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RESCHEDULE MODAL */}
      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Reschedule Appointment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Patient: <span className="font-semibold text-slate-800">{selectedAppointment.patient?.name}</span> with{' '}
              <span className="font-semibold text-slate-800">{selectedAppointment.doctor?.name}</span>
            </p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select New Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={rescheduleDate}
                  onChange={(e) => handleRescheduleDateChange(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Available Slot *
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {availableSlotsList.map((slot) => {
                    const isBooked = bookedSlots.includes(slot) && slot !== selectedAppointment.slot
                    const isSelected = rescheduleSlot === slot

                    return (
                      <button
                        type="button"
                        key={slot}
                        disabled={isBooked}
                        onClick={() => setRescheduleSlot(slot)}
                        className={`py-2 rounded-lg text-xs font-medium border text-center transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                            : isBooked
                            ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed line-through'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
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
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submittingAction ? 'Updating...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Cancel Appointment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Cancel booking for <span className="font-semibold text-slate-800">{selectedAppointment.patient?.name}</span> on{' '}
              <span className="font-semibold text-slate-800">{selectedAppointment.date} ({selectedAppointment.slot})</span>
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Cancellation Reason
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Doctor emergency leave, administrative conflict..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submittingAction ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRESCRIPTION PREVIEW & PRINT MODAL */}
      {showPrescriptionModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col print:m-0 print:p-0 print:shadow-none print:border-none print:w-full print:max-w-none">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>Medical Consultation Report & Prescription</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPrescription}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Prescription Body */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6 text-slate-800">
              {/* Hospital Header */}
              <div className="flex items-start justify-between border-b-2 border-indigo-600 pb-4">
                <div>
                  <h1 className="text-xl font-bold text-indigo-700 tracking-tight">Prescripto OPD Hospital</h1>
                  <p className="text-xs text-slate-500">Online OPD Central Health Network</p>
                  <p className="text-[11px] text-slate-400">Emergency & Outpatient Department</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800">Appointment #{selectedAppointment._id.slice(-6)}</p>
                  <p className="text-[11px] text-slate-500">Date: {selectedAppointment.date}</p>
                  <p className="text-[11px] text-slate-500 font-mono">Time: {selectedAppointment.slot}</p>
                </div>
              </div>

              {/* Patient & Doctor Row */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Patient Details</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedAppointment.patient?.name}</p>
                  <p className="text-slate-500">{selectedAppointment.patient?.email}</p>
                  <p className="text-slate-500">
                    Age: {selectedAppointment.patient?.age || '—'} yrs • Gender: {selectedAppointment.patient?.gender || '—'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Consulting Physician</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedAppointment.doctor?.name}</p>
                  <p className="text-indigo-600 font-semibold">{selectedAppointment.doctor?.speciality}</p>
                  <p className="text-slate-400 font-mono">{selectedAppointment.doctor?.degree || 'MBBS'}</p>
                </div>
              </div>

              {/* Clinical Notes */}
              <div className="space-y-4 text-xs">
                {selectedAppointment.prescription?.symptoms && (
                  <div>
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                      Reported Symptoms & Observations
                    </h4>
                    <p className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                      {selectedAppointment.prescription.symptoms}
                    </p>
                  </div>
                )}

                {selectedAppointment.prescription?.diagnosis && (
                  <div>
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                      Clinical Diagnosis
                    </h4>
                    <p className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200 text-emerald-900 font-semibold">
                      {selectedAppointment.prescription.diagnosis}
                    </p>
                  </div>
                )}

                {selectedAppointment.prescription?.treatment && (
                  <div>
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                      Treatment Plan & Advice
                    </h4>
                    <p className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                      {selectedAppointment.prescription.treatment}
                    </p>
                  </div>
                )}

                {/* Prescribed Medicines */}
                {Array.isArray(selectedAppointment.prescription?.medicines) &&
                  selectedAppointment.prescription.medicines.length > 0 && (
                    <div>
                      <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
                        Rx — Prescribed Medications
                      </h4>
                      <table className="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 text-[10px] uppercase">
                            <th className="py-2 px-3 border border-slate-200">Medicine Name</th>
                            <th className="py-2 px-3 border border-slate-200">Dosage</th>
                            <th className="py-2 px-3 border border-slate-200">Frequency</th>
                            <th className="py-2 px-3 border border-slate-200">Duration</th>
                            <th className="py-2 px-3 border border-slate-200">Instructions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {selectedAppointment.prescription.medicines.map((med, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-semibold text-slate-900 border border-slate-200">
                                {med.name}
                              </td>
                              <td className="py-2 px-3 text-slate-600 border border-slate-200">{med.dosage || '—'}</td>
                              <td className="py-2 px-3 text-slate-600 border border-slate-200">
                                {med.frequency || '1-0-1'}
                              </td>
                              <td className="py-2 px-3 text-slate-600 border border-slate-200">
                                {med.duration || '5 days'}
                              </td>
                              <td className="py-2 px-3 text-slate-500 border border-slate-200">
                                {med.instructions || 'After meals'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                {selectedAppointment.prescription?.followUpDate && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between">
                    <span className="font-semibold">Recommended Follow-up Date:</span>
                    <span className="font-bold">{selectedAppointment.prescription.followUpDate}</span>
                  </div>
                )}
              </div>

              {/* Footer Stamp */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
                <p>Generated electronically via OPD Prescripto Management System.</p>
                <div className="text-right">
                  <div className="h-10 border-b border-dashed border-slate-300 w-40 mb-1" />
                  <p className="font-bold text-slate-700">Dr. {selectedAppointment.doctor?.name}</p>
                  <p className="text-[10px]">Authorized Signature</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-right print:hidden">
              <button
                onClick={() => setShowPrescriptionModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Appointments
