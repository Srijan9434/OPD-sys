import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import DoctorCard from '../../components/DoctorCard'
import { specialities } from '../../api/mockData'
import api from '../../api/axios'

export default function Doctors() {
  const { speciality } = useParams()
  const navigate = useNavigate()
  const [doctorsList, setDoctorsList] = useState([])
  const [specialitiesList, setSpecialitiesList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSpecialities = async () => {
      try {
        const res = await api.get('/specialities')
        if (res.data.success && res.data.data?.length > 0) {
          setSpecialitiesList(res.data.data)
        } else {
          setSpecialitiesList(specialities)
        }
      } catch {
        setSpecialitiesList(specialities)
      }
    }
    fetchSpecialities()
  }, [])

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true)
      try {
        const params = speciality ? { speciality } : {}
        const res = await api.get('/doctors', { params })
        if (res.data.success) {
          setDoctorsList(res.data.data)
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load doctors')
      } finally {
        setLoading(false)
      }
    }
    fetchDoctors()
  }, [speciality])

  const toggle = (name) =>
    navigate(speciality === name ? '/doctors' : `/doctors/${encodeURIComponent(name)}`)

  return (
    <div className="mt-8">
      <p className="text-gray-600">Browse through our specialized medical practitioners.</p>
      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex w-full flex-col gap-3 text-sm text-gray-600 sm:w-56">
          {specialitiesList.map((s) => (
            <p
              key={s.name}
              onClick={() => toggle(s.name)}
              className={`cursor-pointer rounded border px-4 py-2.5 transition ${
                speciality === s.name ? 'border-indigo-200 bg-indigo-100 text-black font-medium' : 'border-gray-300'
              }`}
            >
              {s.name}
            </p>
          ))}
        </div>

        <div className="flex-1">
          {loading ? (
            <div className="py-20 text-center text-sm text-gray-500">Loading verified doctors...</div>
          ) : doctorsList.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-500">
              No doctors found {speciality ? `in ${speciality}` : ''}.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {doctorsList.map((d) => (
                <DoctorCard key={d._id} doctor={d} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}