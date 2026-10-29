import { useState } from 'react'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/ConfirmModal'
import SlotPicker, { toYMD } from '../../components/SlotPicker'
import { doctors, myAppointments } from '../../api/mockData'

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

const formatDate = (d) => new Date(d + 'T00:00:00').toDateString()

export default function MyAppointments() {
  const [appointments, setAppointments] = useState(myAppointments)
  const [tab, setTab] = useState('Upcoming')
  const [cancelId, setCancelId] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [reschedId, setReschedId] = useState(null)
  const [newSel, setNewSel] = useState({ date: toYMD(new Date()), slot: '' })

  const list = appointments.filter((a) => inTab(a, tab))

  const confirmCancel = () => {
    // replace with PUT /api/appointments/:id/cancel later
    setAppointments((prev) =>
      prev.map((a) => (a._id === cancelId ? { ...a, status: 'cancelled' } : a))
    )
    setCancelId(null)
    toast.success('Appointment cancelled')
  }

  const openResched = (id) => {
    setReschedId(id)
    setNewSel({ date: toYMD(new Date()), slot: '' })
  }

  const confirmResched = () => {
    if (!newSel.slot) return toast.error('Please select a new time slot')
    // replace with PUT /api/appointments/:id/reschedule later
    setAppointments((prev) =>
      prev.map((a) =>
        a._id === reschedId
          ? { ...a, rescheduledFrom: { date: a.date, slot: a.slot }, date: newSel.date, slot: newSel.slot, status: 'pending' }
          : a
      )
    )
    setReschedId(null)
    toast.success('Appointment rescheduled')
  }

  const downloadPdf = (what) => toast(`${what} PDF will download once the backend is connected`)

  return (
    <div className="mt-8">
      <p className="text-lg font-medium text-gray-700">My Appointments</p>

      <div className="mt-4 flex gap-3 border-b">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-gray-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <p className="mt-10 text-gray-500">No {tab.toLowerCase()} appointments.</p>
      )}

      <div className="mt-4 space-y-4">
        {list.map((a) => {
          const doc = doctors.find((d) => d._id === a.doctorId)
          return (
            <div key={a._id} className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row">
              <img
                src={doc?.image}
                alt={doc?.name}
                className="h-32 w-32 rounded bg-[#eaefff] object-cover object-top"
              />

              <div className="flex-1 text-sm text-gray-600">
                <p className="text-lg font-medium text-gray-900">{doc?.name}</p>
                <p>{doc?.speciality}</p>
                <p className="mt-2">
                  <span className="font-medium text-gray-700">Date & Time:</span>{' '}
                  {formatDate(a.date)} | {a.slot}
                </p>
                {a.rescheduledFrom && (
                  <p className="text-xs text-gray-400">
                    Rescheduled from {formatDate(a.rescheduledFrom.date)} | {a.rescheduledFrom.slot}
                  </p>
                )}
                <p>
                  <span className="font-medium text-gray-700">Payment:</span>{' '}
                  {a.payment.mode} · ₹{a.payment.amount} · {a.payment.status}
                </p>
                <span className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs ${statusStyle[a.status]}`}>
                  {a.status}
                </span>
                {a.status === 'doctor-unavailable' && (
                  <p className="mt-2 text-orange-600">
                    Your doctor is unavailable on this date. Please reschedule.
                  </p>
                )}
              </div>

              <div className="flex flex-col justify-end gap-2 text-sm sm:min-w-48">
                {tab === 'Upcoming' && (
                  <>
                    <button
                      onClick={() => openResched(a._id)}
                      className="rounded border px-4 py-2 text-gray-600 hover:bg-primary hover:text-white"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => setCancelId(a._id)}
                      className="rounded border px-4 py-2 text-gray-600 hover:bg-red-500 hover:text-white"
                    >
                      Cancel appointment
                    </button>
                  </>
                )}
                {tab === 'Past' && a.prescription && (
                  <>
                    <button
                      onClick={() => setViewing(a.prescription)}
                      className="rounded border px-4 py-2 text-gray-600 hover:bg-primary hover:text-white"
                    >
                      View prescription
                    </button>
                    <button
                      onClick={() => downloadPdf('Prescription')}
                      className="rounded border px-4 py-2 text-gray-600 hover:bg-primary hover:text-white"
                    >
                      Download prescription
                    </button>
                  </>
                )}
                {a.payment.status === 'paid' && tab !== 'Cancelled' && (
                  <button
                    onClick={() => downloadPdf('Receipt')}
                    className="rounded border px-4 py-2 text-gray-600 hover:bg-primary hover:text-white"
                  >
                    Download receipt
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmModal
        open={!!cancelId}
        title="Cancel this appointment?"
        message="The slot will be released and the doctor will be notified."
        confirmText="Yes, cancel"
        onConfirm={confirmCancel}
        onCancel={() => setCancelId(null)}
      />

      {viewing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4" onClick={() => setViewing(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900">Prescription</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {viewing.medicines.map((m, i) => (
                <li key={i} className="rounded border p-2">
                  {m.name} — {m.dosage} — {m.duration}
                </li>
              ))}
            </ul>
            {viewing.notes && <p className="mt-3 text-sm text-gray-600">Notes: {viewing.notes}</p>}
            <button onClick={() => setViewing(null)} className="mt-5 rounded-full bg-primary px-6 py-2 text-sm text-white">
              Close
            </button>
          </div>
        </div>
      )}

      {reschedId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6">
            <h3 className="text-lg font-medium text-gray-900">Reschedule appointment</h3>
            <p className="mt-1 text-sm text-gray-500">Pick a new day and time.</p>
            <SlotPicker onChange={setNewSel} />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setReschedId(null)} className="rounded-full border px-5 py-2 text-sm text-gray-600">
                Go back
              </button>
              <button onClick={confirmResched} className="rounded-full bg-primary px-5 py-2 text-sm text-white">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}