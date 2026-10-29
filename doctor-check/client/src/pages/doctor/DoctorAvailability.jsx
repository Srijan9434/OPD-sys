import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import DoctorNavbar from '../../components/doctor/DoctorNavbar'
import { doctorApi } from '../../api/doctorApi'

const ALL_SLOTS = [
  '8:00 am',
  '8:30 am',
  '9:00 am',
  '9:30 am',
  '10:00 am',
  '10:30 am',
  '11:00 am',
  '11:30 am',
]

export default function DoctorAvailability() {
  const [available, setAvailable] = useState(true)
  const [selectedSlots, setSelectedSlots] = useState([
    '8:00 am',
    '8:30 am',
    '9:00 am',
    '9:30 am',
    '10:00 am',
    '10:30 am',
    '11:00 am',
    '11:30 am',
  ])
  const [fee, setFee] = useState(500)
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)

  // Emergency Leave Form
  const [leaveStart, setLeaveStart] = useState('')
  const [leaveEnd, setLeaveEnd] = useState('')
  const [leaveReason, setLeaveReason] = useState('')
  const [triggeringLeave, setTriggeringLeave] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true)
      try {
        const res = await doctorApi.getDashboard()
        if (res.data.success && res.data.data?.doctor) {
          const doc = res.data.data.doctor
          setAvailable(doc.available !== undefined ? doc.available : true)
          if (Array.isArray(doc.slots) && doc.slots.length > 0) {
            setSelectedSlots(doc.slots)
          }
          if (doc.fee !== undefined) {
            setFee(doc.fee)
          }
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not fetch current doctor settings')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const toggleSlot = (slot) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== slot))
    } else {
      setSelectedSlots([...selectedSlots, slot])
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      await doctorApi.updateAvailability({
        available,
        slots: selectedSlots,
        fee: Number(fee),
      })
      toast.success('Doctor availability and consultation settings updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update availability settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleTriggerEmergencyLeave = async (e) => {
    e.preventDefault()
    if (!leaveStart) {
      return toast.error('Please select an emergency leave start date')
    }

    const confirmLeave = window.confirm(
      'Activating emergency leave will mark affected patient appointments as doctor-unavailable and dispatch email alerts. Proceed?'
    )
    if (!confirmLeave) return

    setTriggeringLeave(true)
    try {
      const res = await doctorApi.emergencyLeave({
        startDate: leaveStart,
        endDate: leaveEnd || leaveStart,
        reason: leaveReason || 'Medical emergency',
      })
      toast.success(res.data.message || 'Emergency leave triggered successfully')
      setAvailable(false)
      setLeaveStart('')
      setLeaveEnd('')
      setLeaveReason('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to trigger emergency leave')
    } finally {
      setTriggeringLeave(false)
    }
  }

  return (
    <div className="min-h-screen pb-16">
      <DoctorNavbar />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Schedule & Availability</h1>
        <p className="text-sm text-gray-500">Configure clinic consultation slots, OPD fee, and trigger emergency leaves.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Availability & Slots Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-1">General Availability & Slots</h2>
          <p className="text-xs text-gray-500 mb-6">Choose active working slots for patient bookings.</p>

          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-800">Clinic Availability Status</p>
                <p className="text-xs text-gray-500">Allow patients to book new appointments</p>
              </div>
              <button
                type="button"
                onClick={() => setAvailable(!available)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  available ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    available ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Consultation Fee (₹)
              </label>
              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Active OPD Slots (30 min increments)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ALL_SLOTS.map((slot) => {
                  const isSelected = selectedSlots.includes(slot)
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleSlot(slot)}
                      className={`text-xs py-2 px-3 rounded-lg border font-medium transition ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-2.5 text-sm bg-primary text-white rounded-xl hover:bg-primary/90 font-medium transition shadow-sm"
            >
              {savingSettings ? 'Saving...' : 'Save Availability & Slots'}
            </button>
          </form>
        </div>

        {/* Emergency Leave Alert Section */}
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-red-100 text-red-600 rounded-lg text-sm">🚨</span>
              <h2 className="text-lg font-bold text-gray-900">Doctor Emergency Leave</h2>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              In case of an urgent emergency, set your unavailable range. All booked patient appointments in this window will be marked <span className="font-semibold text-red-600">doctor-unavailable</span> and dispatched automated email alerts.
            </p>

            <form onSubmit={handleTriggerEmergencyLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={leaveStart}
                  onChange={(e) => setLeaveStart(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-red-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  End Date (Optional, defaults to single day)
                </label>
                <input
                  type="date"
                  value={leaveEnd}
                  onChange={(e) => setLeaveEnd(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-red-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Emergency Reason
                </label>
                <textarea
                  rows="3"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="e.g. Sudden medical emergency / personal unavailability"
                  className="w-full text-sm border border-gray-200 rounded-lg p-3 outline-none focus:border-red-400 resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={triggeringLeave}
                className="w-full py-2.5 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition shadow-sm"
              >
                {triggeringLeave ? 'Dispatching Emergency Alerts...' : 'Trigger Emergency Leave & Notify Patients'}
              </button>
            </form>
          </div>

          <div className="mt-6 p-3.5 bg-red-50/60 rounded-xl border border-red-100">
            <p className="text-xs text-red-700 leading-relaxed">
              <strong>Notice:</strong> This action triggers email notifications using Nodemailer to affected patients so they can reschedule promptly.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
