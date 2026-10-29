import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import DoctorNavbar from '../../components/doctor/DoctorNavbar'
import PrescriptionModal from '../../components/doctor/PrescriptionModal'
import PatientHistoryModal from '../../components/doctor/PatientHistoryModal'
import { doctorApi } from '../../api/doctorApi'

export default function DoctorDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Prescription modal state
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false)

  // History modal state
  const [historyData, setHistoryData] = useState(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const res = await doctorApi.getDashboard()
      if (res.data.success) {
        setData(res.data.data)
      } else {
        toast.error(res.data.message || 'Failed to load dashboard data')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error connecting to doctor dashboard')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const handleStatusChange = async (id, status) => {
    try {
      await doctorApi.updateStatus(id, status)
      toast.success(`Appointment marked as ${status}`)
      fetchDashboard()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleMarkPaid = async (id) => {
    try {
      await doctorApi.markPaymentPaid(id)
      toast.success('Cash payment marked as paid')
      fetchDashboard()
    } catch {
      toast.error('Failed to update payment status')
    }
  }

  const handleSavePrescription = async (prescriptionData) => {
    try {
      await doctorApi.savePrescription(selectedAppointment._id, prescriptionData)
      toast.success('Prescription recorded and consultation completed')
      fetchDashboard()
    } catch {
      toast.error('Failed to save prescription')
    }
  }

  const handleViewHistory = async (patientId) => {
    setIsHistoryOpen(true)
    setLoadingHistory(true)
    try {
      const res = await doctorApi.getPatientHistory(patientId)
      if (res.data.success) {
        setHistoryData(res.data.data)
      } else {
        toast.error(res.data.message || 'Could not load patient history')
        setHistoryData(null)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load patient history')
      setHistoryData(null)
    } finally {
      setLoadingHistory(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen py-10">
        <DoctorNavbar />
        <div className="text-center py-20 text-gray-500">Loading doctor dashboard...</div>
      </div>
    )
  }

  const stats = data?.stats || {}
  const todayAppointments = data?.todayAppointments || []

  return (
    <div className="min-h-screen pb-16">
      <DoctorNavbar />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of your OPD schedule, patient queue, and consultations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/doctor/availability"
            className="px-4 py-2 text-sm bg-primary/10 text-primary hover:bg-primary/20 rounded-xl font-medium transition"
          >
            Manage Availability & Leave
          </Link>
          <Link
            to="/doctor/appointments"
            className="px-4 py-2 text-sm bg-primary text-white hover:bg-primary/90 rounded-xl font-medium shadow-sm transition"
          >
            All Appointments
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Today's Patients</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.todayCount || 0}</h3>
          <span className="text-xs text-primary font-medium mt-1 inline-block">Active queue</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-2">{stats.pendingAppointments || 0}</h3>
          <span className="text-xs text-gray-500 mt-1 inline-block">Awaiting consultation</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed</p>
          <h3 className="text-2xl font-bold text-green-600 mt-2">{stats.completedAppointments || 0}</h3>
          <span className="text-xs text-gray-500 mt-1 inline-block">Successful visits</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Earnings</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">₹{stats.totalEarnings || 0}</h3>
          <span className="text-xs text-green-600 font-medium mt-1 inline-block">From paid consultations</span>
        </div>
      </div>

      {/* Today's Queue Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Today's OPD Queue</h2>
            <p className="text-xs text-gray-500">Patients scheduled for today</p>
          </div>
          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
            {todayAppointments.length} Booked
          </span>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            No patients scheduled for today.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Slot</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {todayAppointments.map((apt) => (
                  <tr key={apt._id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4 font-semibold text-gray-800 whitespace-nowrap">{apt.slot}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-medium text-gray-900">{apt.patient?.name || 'Patient'}</p>
                      <button
                        onClick={() => handleViewHistory(apt.patient?._id)}
                        className="text-xs text-primary hover:underline"
                      >
                        View History
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600 max-w-xs truncate">{apt.reason || 'General Checkup'}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            apt.payment?.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {apt.payment?.status === 'paid' ? 'Paid' : 'Unpaid (Cash)'}
                        </span>
                        {apt.payment?.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkPaid(apt._id)}
                            className="text-xs text-primary underline"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-medium ${
                          apt.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : apt.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-700'
                            : apt.status === 'rejected' || apt.status === 'doctor-unavailable'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {apt.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(apt._id, 'confirmed')}
                            className="text-xs px-2.5 py-1 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
                          >
                            Accept
                          </button>
                        )}
                        {apt.status !== 'completed' && apt.status !== 'rejected' && apt.status !== 'doctor-unavailable' && (
                          <button
                            onClick={() => {
                              setSelectedAppointment(apt)
                              setIsPrescriptionOpen(true)
                            }}
                            className="text-xs px-2.5 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                          >
                            Prescribe & Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Prescription Modal */}
      <PrescriptionModal
        isOpen={isPrescriptionOpen}
        onClose={() => setIsPrescriptionOpen(false)}
        appointment={selectedAppointment}
        onSave={handleSavePrescription}
      />

      {/* Patient History Modal */}
      <PatientHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        data={historyData}
        loading={loadingHistory}
      />
    </div>
  )
}
