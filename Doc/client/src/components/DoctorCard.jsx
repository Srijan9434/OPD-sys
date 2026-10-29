import { useNavigate } from 'react-router-dom'

export default function DoctorCard({ doctor }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/appointment/${doctor._id}`)}
      className="cursor-pointer overflow-hidden rounded-xl border border-blue-100 transition hover:-translate-y-2"
    >
      <img
        src={doctor.image || '/doctors/doc1.png'}
        alt={doctor.name}
        className="h-56 w-full bg-[#eaefff] object-cover object-top"
      />
      <div className="p-4">
        <p className={`flex items-center gap-2 text-sm ${doctor.available ? 'text-green-500' : 'text-gray-400'}`}>
          <span className={`h-2 w-2 rounded-full ${doctor.available ? 'bg-green-500' : 'bg-gray-400'}`} />
          {doctor.available ? 'Available' : 'Not available'}
        </p>
        <p className="text-lg font-medium text-gray-900">{doctor.name}</p>
        <p className="text-sm text-gray-600">{doctor.speciality}</p>
      </div>
    </div>
  )
}