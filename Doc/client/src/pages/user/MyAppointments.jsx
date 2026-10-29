import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/ConfirmModal'
import SlotPicker, { toYMD } from '../../components/SlotPicker'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

const TABS = ['Upcoming', 'Past', 'Cancelled']

const statusStyle = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-600',
  rejected: 'bg-red-100 text-red-600',
  'doctor-unavailable': 'bg-orange-100 text-orange-700',
}

const inTab = (a, tab) => {
  if (tab === 'Upcoming') return ['pending', 'confirmed', 'doctor-unavailable'].includes(a.status)
  if (tab === 'Past') return a.status === 'completed'
  return ['cancelled', 'rejected'].includes(a.status)
}

const formatDate = (d) => {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toDateString()
}

export default function MyAppointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('Upcoming')
  const [cancelId, setCancelId] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [reschedId, setReschedId] = useState(null)
  const [newSel, setNewSel] = useState({ date: toYMD(new Date()), slot: '' })

  const fetchAppointments = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await api.get('/appointments/my')
      if (res.data.success) {
        setAppointments(res.data.data)
      } else {
        toast.error(res.data.message || 'Failed to fetch appointments')
        setAppointments([])
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load your appointments')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchAppointments()
    } else {
      setLoading(false)
    }
  }, [user])

  const list = appointments.filter((a) => inTab(a, tab))

  const confirmCancel = async () => {
    if (!cancelId) return
    try {
      const res = await api.put(`/appointments/${cancelId}/cancel`, {
        reason: 'Cancelled by patient',
      })
      if (res.data.success) {
        toast.success('Appointment cancelled successfully')
        fetchAppointments()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment')
    } finally {
      setCancelId(null)
    }
  }

  const openResched = (id) => {
    setReschedId(id)
    setNewSel({ date: toYMD(new Date()), slot: '' })
  }

  const confirmResched = async () => {
    if (!newSel.slot) return toast.error('Please select a new time slot')
    try {
      const res = await api.put(`/appointments/${reschedId}/reschedule`, {
        date: newSel.date,
        slot: newSel.slot,
      })
      if (res.data.success) {
        toast.success('Appointment rescheduled successfully')
        fetchAppointments()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reschedule appointment')
    } finally {
      setReschedId(null)
    }
  }

  const downloadPdf = (what) => {
    toast(`${what} PDF download endpoint is coming in the next release.`)
  }

  if (!user) {
    return (
      <div className="mt-16 text-center">
        <h2 className="text-xl font-semibold text-gray-800">Please Sign In</h2>
        <p className="mt-2 text-sm text-gray-500">
          You must be logged in as a patient to view and manage your booked appointments.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-block rounded-full bg-primary px-8 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary/90"
        >
          Go to Login
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <p className="text-lg font-medium text-gray-700">My Appointments</p>

      <div className="mt-4 flex gap-3 border-b">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm transition ${
              tab === t ? 'border-primary text-primary font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-500">Loading your appointments...</div>
      ) : list.length === 0 ? (
        <p className="mt-10 text-gray-500 text-sm">No {tab.toLowerCase()} appointments.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {list.map((a) => {
            const doc = a.doctor || {}
            return (
              <div key={a._id} className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row bg-white shadow-xs">
                <img
                  src={doc.image || '/doctors/doc1.png'}
                  alt={doc.name || 'Doctor'}
                  className="h-32 w-32 rounded bg-[#eaefff] object-cover object-top"
                />

                <div className="flex-1 text-sm text-gray-600">
                  <p className="text-lg font-medium text-gray-900">{doc.name || 'Doctor'}</p>
                  <p>{doc.speciality || 'Specialist'}</p>
                  <p className="mt-2">
                    <span className="font-medium text-gray-700">Date & Time:</span>{' '}
                    {formatDate(a.date)} | {a.slot}
                  </p>
                  {a.reason && (
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-medium text-gray-600">Reason:</span> {a.reason}
                    </p>
                  )}
                  {a.rescheduledFrom && (
                    <p className="text-xs text-gray-400 mt-1">
                      Rescheduled from {formatDate(a.rescheduledFrom.date)} | {a.rescheduledFrom.slot}
                    </p>
                  )}
                  <p className="mt-1">
                    <span className="font-medium text-gray-700">Payment:</span>{' '}
                    {a.payment?.mode || 'cash'} · ₹{a.payment?.amount || doc.fee || 0} ·{' '}
                    <span className={a.payment?.status === 'paid' ? 'text-green-600 font-medium' : 'text-amber-600'}>
                      {a.payment?.status || 'pending'}
                    </span>
                  </p>
                  <span className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-medium ${statusStyle[a.status] || 'bg-gray-100 text-gray-600'}`}>
                    {a.status}
                  </span>
                  {a.status === 'doctor-unavailable' && (
                    <p className="mt-2 text-xs font-medium text-orange-600">
                      Your doctor is unavailable on this date. Please reschedule to another slot.
                    </p>
                  )}
                </div>

                <div className="flex flex-col justify-end gap-2 text-sm sm:min-w-48">
                  {tab === 'Upcoming' && (
                    <>
                      <button
                        onClick={() => openResched(a._id)}
                        className="rounded border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-primary hover:text-white"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => setCancelId(a._id)}
                        className="rounded border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-red-500 hover:text-white"
                      >
                        Cancel appointment
                      </button>
                    </>
                  )}
                  {tab === 'Past' && a.prescription && (
                    <>
                      <button
                        onClick={() => setViewing(a.prescription)}
                        className="rounded border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-primary hover:text-white"
                      >
                        View prescription
                      </button>
                      <button
                        onClick={() => downloadPdf('Prescription')}
                        className="rounded border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-primary hover:text-white"
                      >
                        Download prescription
                      </button>
                    </>
                  )}
                  {a.payment?.status === 'paid' && tab !== 'Cancelled' && (
                    <button
                      onClick={() => downloadPdf('Receipt')}
                      className="rounded border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-primary hover:text-white"
                    >
                      Download receipt
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        open={!!cancelId}
        title="Cancel this appointment?"
        message="The slot will be released and the doctor will be notified."
        confirmText="Yes, cancel"
        onConfirm={confirmCancel}
        onCancel={() => setCancelId(null)}
      />

      {/* Prescription View Modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4 backdrop-blur-xs" onClick={() => setViewing(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Medical Prescription</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {viewing.medicines?.map((m, i) => (
                <li key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">
                  <p className="font-medium text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-500">Dosage: {m.dosage} | Duration: {m.duration}</p>
                </li>
              ))}
            </ul>
            {viewing.notes && (
              <p className="mt-3 text-sm text-gray-600 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                <strong className="text-gray-800">Doctor's Advice:</strong> {viewing.notes}
              </p>
            )}
            <div className="mt-5 flex justify-end">
              <button onClick={() => setViewing(null)} className="rounded-full bg-primary px-6 py-2 text-sm text-white">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Reschedule Appointment</h3>
            <p className="mt-1 text-sm text-gray-500">Pick a new consultation date and time slot.</p>
            <SlotPicker onChange={setNewSel} />
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setReschedId(null)}
                className="rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Go back
              </button>
              <button
                onClick={confirmResched}
                className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}