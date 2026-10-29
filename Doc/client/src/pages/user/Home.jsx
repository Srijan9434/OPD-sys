import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import DoctorCard from '../../components/DoctorCard'
import { specialities } from '../../api/mockData'
import api from '../../api/axios'

export default function Home() {
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
        const res = await api.get('/doctors')
        if (res.data.success) {
          setDoctorsList(res.data.data)
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not load doctors')
      } finally {
        setLoading(false)
      }
    }
    fetchDoctors()
  }, [])

  return (
    <>
      {/* Hero */}
      <section className="mt-6 flex flex-col overflow-hidden rounded-xl bg-primary px-6 md:flex-row md:px-10 lg:px-20">
        <div className="flex flex-col items-start justify-center gap-4 py-10 md:w-1/2 md:py-[10vw]">
          <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl">
            Book Appointment <br /> With Trusted Doctors
          </h1>
          <p className="text-sm text-white">
            Simply browse through our extensive list of trusted doctors, schedule your
            appointment hassle-free.
          </p>
          <Link
            to="/doctors"
            className="rounded-full bg-white px-8 py-3 text-sm text-gray-600 transition hover:scale-105"
          >
            Book appointment →
          </Link>
        </div>
        <div className="relative md:w-1/2">
          <img src="/hero.png" alt="" className="h-auto w-full md:absolute md:bottom-0" />
        </div>
      </section>

      {/* Speciality */}
      <section className="flex flex-col items-center gap-4 py-16 text-gray-800">
        <h2 className="text-3xl font-medium">Find by Speciality</h2>
        <p className="max-w-md text-center text-sm">
          Simply browse through our extensive list of trusted doctors, schedule your
          appointment hassle-free.
        </p>
        <div className="flex w-full gap-6 overflow-x-auto pt-5 sm:justify-center">
          {specialitiesList.map((s) => (
            <Link
              key={s.name}
              to={`/doctors/${encodeURIComponent(s.name)}`}
              className="flex shrink-0 flex-col items-center gap-2 text-xs transition hover:-translate-y-2"
            >
              <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-b from-blue-100 to-gray-300 text-3xl sm:h-24 sm:w-24 sm:text-4xl">
                {s.icon || '🩺'}
              </span>
              {s.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Top doctors */}
      <section className="flex flex-col items-center gap-4 text-gray-800">
        <h2 className="text-3xl font-medium">Top Doctors to Book</h2>
        <p className="text-center text-sm">Simply browse through our extensive list of trusted doctors.</p>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading verified doctors...</div>
        ) : (
          <div className="grid w-full grid-cols-2 gap-4 pt-5 md:grid-cols-4 lg:grid-cols-5">
            {doctorsList.slice(0, 10).map((d) => (
              <DoctorCard key={d._id} doctor={d} />
            ))}
            {doctorsList.length === 0 && (
              <p className="col-span-full py-8 text-center text-gray-500">No doctors currently available.</p>
            )}
          </div>
        )}

        <button
          onClick={() => navigate('/doctors')}
          className="mt-8 rounded-full bg-blue-50 px-12 py-3 text-gray-600 transition hover:bg-blue-100"
        >
          more
        </button>
      </section>

      {/* CTA banner */}
      <section className="my-20 flex overflow-hidden rounded-xl bg-primary px-6 sm:px-10 md:px-14">
        <div className="flex-1 py-8 sm:py-10 md:py-16 lg:py-24">
          <p className="text-xl font-semibold text-white sm:text-2xl md:text-3xl lg:text-5xl">
            Book Appointment <br /> With 100+ Trusted Doctors
          </p>
          <button
            onClick={() => navigate('/register')}
            className="mt-6 rounded-full bg-white px-8 py-3 text-sm text-gray-600 transition hover:scale-105"
          >
            Create account
          </button>
        </div>
        <div className="relative hidden md:block md:w-1/2 lg:w-[370px]">
          <img src="/cta.png" alt="" className="absolute bottom-0 right-0 w-full max-w-md" />
        </div>
      </section>
    </>
  )
}