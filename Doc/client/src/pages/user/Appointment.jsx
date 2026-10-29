import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import SlotPicker, { toYMD } from '../../components/SlotPicker'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

export default function Appointment() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selection, setSelection] = useState({ date: toYMD(new Date()), slot: '' })
  const [bookedSlots, setBookedSlots] = useState([])
  const [reason, setReason] = useState('')
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/doctors/${id}`)
        if (res.data.success) {
          setDoctor(res.data.data)
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Doctor not found')
        setDoctor(null)
      } finally {
        setLoading(false)
      }
    }
    fetchDoctor()
  }, [id])

  useEffect(() => {
    if (!id || !selection.date) return
    const fetchBooked = async () => {
      try {
        const res = await api.get(`/appointments/booked-slots/${id}?date=${selection.date}`)
        if (res.data?.success) {
          setBookedSlots(res.data.bookedSlots || [])
        }
      } catch {
        setBookedSlots([])
      }
    }
    fetchBooked()
  }, [id, selection.date])

  const handleBook = async () => {
    if (!user) {
      toast.error('Please log in to book an appointment.')
      return navigate('/login')
    }

    if (!selection.slot) {
      return toast.error('Please select an available consultation time slot.')
    }

    if (!doctor.available) {
      return toast.error('This doctor is currently not accepting new appointments.')
    }

    setBooking(true)
    try {
      const payload = {
        doctorId: doctor._id,
        date: selection.date,
        slot: selection.slot,
        reason: reason.trim() || 'General consultation',
        paymentMode: 'cash',
      }

      const res = await api.post('/appointments', payload)

      if (res.data.success) {
        toast.success(`Booked with ${doctor.name} on ${selection.date} at ${selection.slot}!`)
        navigate('/my-appointments')
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to book appointment. Please try again.'
      toast.error(errorMsg)
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-gray-500">
        Loading doctor profile and available slots...
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500 text-lg">Doctor not found.</p>
        <button
          onClick={() => navigate('/doctors')}
          className="mt-4 rounded-full bg-primary px-6 py-2 text-sm text-white"
        >
          View all doctors
        </button>
      </div>
    )
  }

  return (
    <div className="mt-8">
      {/* Doctor Info Card */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <img
          src={doctor.image || '/doctors/doc1.png'}
          alt={doctor.name}
          className="w-full rounded-lg bg-primary object-cover object-top sm:max-w-72"
        />
        <div className="flex-1 rounded-lg border border-gray-300 bg-white p-8 shadow-sm">
          <p className="flex items-center gap-2 text-3xl font-medium text-gray-900">
            {doctor.name}
            <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-xs text-white">✓</span>
          </p>
          <div className="mt-2 flex items-center gap-2 text-gray-600">
            <p>{doctor.degree} - {doctor.speciality}</p>
            <span className="rounded-full border px-2 py-0.5 text-xs">{doctor.experience || 'Experienced'}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                doctor.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {doctor.available ? 'Available' : 'Unavailable'}
            </span>
          </div>
          <p className="mt-4 text-sm font-medium text-gray-900">About Doctor</p>
          <p className="mt-1 max-w-[700px] text-sm text-gray-600 leading-relaxed">
            {doctor.about || 'Dedicated to providing comprehensive healthcare and specialized consultation.'}
          </p>
          <p className="mt-4 text-gray-600 font-medium">
            Appointment fee: <span className="text-gray-900 font-semibold">₹{doctor.fee}</span>
          </p>
        </div>
      </div>

      {/* Booking Slot Selection */}
      <div className="font-medium text-gray-700 sm:ml-72 sm:pl-4">
        <p className="mt-8 text-lg font-semibold text-gray-900">Select Booking Slot</p>

        <SlotPicker
          onChange={setSelection}
          availableSlots={doctor.slots}
          bookedSlots={bookedSlots}
        />

        {/* Reason / Symptoms input */}
        <div className="mt-6 max-w-lg">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
            Reason for Visit / Symptoms (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Fever, recurring headache, routine consultation"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          onClick={handleBook}
          disabled={booking || !doctor.available}
          className="my-6 rounded-full bg-primary px-14 py-3 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 shadow-md shadow-primary/20"
        >
          {booking ? 'Booking Appointment...' : 'Book an appointment'}
        </button>
      </div>
    </div>
  )
}