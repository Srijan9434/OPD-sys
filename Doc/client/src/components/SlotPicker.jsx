import { useState } from 'react'

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const TIMES = ['8:00 am', '8:30 am', '9:00 am', '9:30 am', '10:00 am', '10:30 am', '11:00 am', '11:30 am']

export const toYMD = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const days = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() + i)
  return d
})

export default function SlotPicker({ onChange, availableSlots, bookedSlots = [] }) {
  const times = Array.isArray(availableSlots) && availableSlots.length > 0 ? availableSlots : TIMES
  const [dayIndex, setDayIndex] = useState(0)
  const [slot, setSlot] = useState('')

  const pickDay = (i) => {
    setDayIndex(i)
    setSlot('')
    onChange({ date: toYMD(days[i]), slot: '' })
  }

  const pickSlot = (t) => {
    if (bookedSlots.includes(t)) return
    setSlot(t)
    onChange({ date: toYMD(days[dayIndex]), slot: t })
  }

  return (
    <div>
      <div className="mt-4 flex gap-3 overflow-x-auto">
        {days.map((d, i) => (
          <div
            key={i}
            onClick={() => pickDay(i)}
            className={`min-w-16 cursor-pointer rounded-full border py-6 text-center transition-all ${
              dayIndex === i ? 'border-primary bg-primary text-white shadow-xs' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <p className="text-xs font-semibold">{DAY_NAMES[d.getDay()]}</p>
            <p className="text-lg font-bold">{d.getDate()}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2.5 overflow-x-auto pb-2 flex-wrap">
        {times.map((t) => {
          const isBooked = bookedSlots.includes(t)
          const isSelected = slot === t

          return (
            <button
              key={t}
              type="button"
              disabled={isBooked}
              onClick={() => pickSlot(t)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-all ${
                isSelected
                  ? 'border-primary bg-primary text-white shadow-xs'
                  : isBooked
                  ? 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed line-through'
                  : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary cursor-pointer'
              }`}
              title={isBooked ? 'Slot already booked by another patient' : 'Available for booking'}
            >
              {t} {isBooked && '(Booked)'}
            </button>
          )
        })}
      </div>
    </div>
  )
}