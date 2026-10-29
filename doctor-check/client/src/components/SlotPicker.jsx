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

export default function SlotPicker({ onChange }) {
  const [dayIndex, setDayIndex] = useState(0)
  const [slot, setSlot] = useState('')

  const pickDay = (i) => {
    setDayIndex(i)
    setSlot('')
    onChange({ date: toYMD(days[i]), slot: '' })
  }

  const pickSlot = (t) => {
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
            className={`min-w-16 cursor-pointer rounded-full border py-6 text-center ${
              dayIndex === i ? 'border-primary bg-primary text-white' : 'border-gray-300'
            }`}
          >
            <p>{DAY_NAMES[d.getDay()]}</p>
            <p>{d.getDate()}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
        {TIMES.map((t) => (
          <p
            key={t}
            onClick={() => pickSlot(t)}
            className={`shrink-0 cursor-pointer rounded-full border px-5 py-2 text-sm font-light ${
              slot === t ? 'border-primary bg-primary text-white' : 'border-gray-300 text-gray-400'
            }`}
          >
            {t}
          </p>
        ))}
      </div>
    </div>
  )
}