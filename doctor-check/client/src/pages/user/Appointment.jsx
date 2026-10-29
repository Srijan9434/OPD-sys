import { useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import SlotPicker, { toYMD } from '../../components/SlotPicker'
import { doctors } from '../../api/mockData'

export default function Appointment() {
  const { id } = useParams()
  const doctor = doctors.find((d) => d._id === id)
  const [selection, setSelection] = useState({ date: toYMD(new Date()), slot: '' })

  if (!doctor) return <p className="mt-10 text-gray-500">Doctor not found.</p>

  const handleBook = () => {
    if (!selection.slot) return toast.error('Please select a time slot')
    // replace with POST /api/appointments later
    toast.success(`Booked with ${doctor.name} on ${selection.date} at ${selection.slot}`)
  }

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-4 sm:flex-row">
        <img
          src={doctor.image}
          alt={doctor.name}
          className="w-full rounded-lg bg-primary object-cover object-top sm:max-w-72"
        />
        <div className="flex-1 rounded-lg border border-gray-400 bg-white p-8">
          <p className="flex items-center gap-2 text-3xl font-medium text-gray-900">
            {doctor.name}
            <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-xs text-white">✓</span>
          </p>
          <div className="mt-2 flex items-center gap-2 text-gray-600">
            <p>{doctor.degree} - {doctor.speciality}</p>
            <span className="rounded-full border px-2 py-0.5 text-xs">{doctor.experience}</span>
          </div>
          <p className="mt-3 text-sm font-medium text-gray-900">About ⓘ</p>
          <p className="mt-1 max-w-[700px] text-sm text-gray-600">{doctor.about}</p>
          <p className="mt-4 text-gray-600">
            Appointment fee: <span className="text-gray-800">₹{doctor.fee}</span>
          </p>
        </div>
      </div>

      <div className="font-medium text-gray-700 sm:ml-72 sm:pl-4">
        <p className="mt-8">Booking slots</p>
        <SlotPicker onChange={setSelection} />
        <button
          onClick={handleBook}
          className="my-6 rounded-full bg-primary px-14 py-3 text-sm font-light text-white"
        >
          Book an appointment
        </button>
      </div>
    </div>
  )
}