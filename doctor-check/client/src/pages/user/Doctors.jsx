import { useNavigate, useParams } from 'react-router-dom'
import DoctorCard from '../../components/DoctorCard'
import { specialities, doctors } from '../../api/mockData'

export default function Doctors() {
  const { speciality } = useParams()
  const navigate = useNavigate()
  const list = speciality ? doctors.filter((d) => d.speciality === speciality) : doctors

  const toggle = (name) =>
    navigate(speciality === name ? '/doctors' : `/doctors/${encodeURIComponent(name)}`)

  return (
    <div className="mt-8">
      <p className="text-gray-600">Browse through the doctors specialist.</p>
      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex w-full flex-col gap-3 text-sm text-gray-600 sm:w-56">
          {specialities.map((s) => (
            <p
              key={s.name}
              onClick={() => toggle(s.name)}
              className={`cursor-pointer rounded border px-4 py-2.5 transition ${
                speciality === s.name ? 'border-indigo-200 bg-indigo-100 text-black' : 'border-gray-300'
              }`}
            >
              {s.name}
            </p>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {list.map((d) => (
            <DoctorCard key={d._id} doctor={d} />
          ))}
          {list.length === 0 && <p className="col-span-full text-gray-500">No doctors found.</p>}
        </div>
      </div>
    </div>
  )
}