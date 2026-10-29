import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import DoctorNavbar from '../../components/doctor/DoctorNavbar'
import PrescriptionModal from '../../components/doctor/PrescriptionModal'
import PatientHistoryModal from '../../components/doctor/PatientHistoryModal'
import { doctorApi } from '../../api/doctorApi'

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState('')

  // Prescription modal state
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false)

  // History modal state
  const [historyData, setHistoryData] = useState(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterStatus) params.status = filterStatus
      if (filterDate) params.date = filterDate

      const res = await doctorApi.getAppointments(params)
      if (res.data.success) {
        setAppointments(res.data.data)
      } else {
        toast.error(res.data.message || 'Failed to fetch appointments')
        setAppointments([])
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch appointments')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [filterStatus, filterDate])

  const handleStatusChange = async (id, status, cancelReason = '') => {
    try {
      await doctorApi.updateStatus(id, status, cancelReason)
      toast.success(`Appointment marked as ${status}`)
      fetchAppointments()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleMarkPaid = async (id) => {
    try {
      await doctorApi.markPaymentPaid(id)
      toast.success('Cash payment marked as paid')
      fetchAppointments()
    } catch {
      toast.error('Failed to update payment status')
    }
  }

  const handleSavePrescription = async (prescriptionData) => {
    try {
      await doctorApi.savePrescription(selectedAppointment._id, prescriptionData)
      toast.success('Prescription recorded and consultation completed')
      fetchAppointments()
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

  return (
    <div className="min-h-screen pb-16">
      <DoctorNavbar />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Appointments</h1>
          <p className="text-sm text-gray-500">Filter, confirm, complete, and review all assigned patient bookings.</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary capitalize bg-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
            <option value="doctor-unavailable">Doctor Unavailable</option>
          </select>
          {(filterStatus || filterDate) && (
            <button
              onClick={() => {
                setFilterStatus('')
                setFilterDate('')
              }}
              className="text-xs text-primary underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">No appointments found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date & Slot</th>
                  <th className="py-3 px-4">Patient Info</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map((apt) => (
                  <tr key={apt._id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-semibold text-gray-900">{apt.date}</p>
                      <p className="text-xs text-gray-500">{apt.slot}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-medium text-gray-900">{apt.patient?.name || 'Patient'}</p>
                      <p className="text-xs text-gray-400">{apt.patient?.email}</p>
                      <button
                        onClick={() => handleViewHistory(apt.patient?._id)}
                        className="text-xs text-primary hover:underline mt-0.5 inline-block"
                      >
                        Visit History
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600 max-w-xs">
                      <p className="truncate">{apt.reason || 'General Consultation'}</p>
                      {apt.prescription?.notes && (
                        <p className="text-gray-400 italic truncate mt-0.5">Rx: {apt.prescription.notes}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            apt.payment?.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {apt.payment?.status === 'paid' ? 'Paid' : `Unpaid (${apt.payment?.mode || 'cash'})`}
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
                          <>
                            <button
                              onClick={() => handleStatusChange(apt._id, 'confirmed')}
                              className="text-xs px-2.5 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleStatusChange(apt._id, 'rejected', 'Slot unavailable')}
                              className="text-xs px-2.5 py-1 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {(apt.status === 'confirmed' || apt.status === 'pending') && (
                          <button
                            onClick={() => handleStatusChange(apt._id, 'waiting')}
                            className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 font-medium cursor-pointer"
                            title="Mark patient as waiting in clinic"
                          >
                            Mark Waiting
                          </button>
                        )}
                        {apt.status === 'waiting' && (
                          <button
                            onClick={() => handleStatusChange(apt._id, 'in-consultation')}
                            className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 font-bold cursor-pointer"
                            title="Call patient into consultation room"
                          >
                            In Consult
                          </button>
                        )}
                        {apt.status !== 'completed' && apt.status !== 'rejected' && apt.status !== 'cancelled' && apt.status !== 'doctor-unavailable' && (
                          <button
                            onClick={() => {
                              setSelectedAppointment(apt)
                              setIsPrescriptionOpen(true)
                            }}
                            className="text-xs px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium cursor-pointer shadow-xs"
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

      <PrescriptionModal
        isOpen={isPrescriptionOpen}
        onClose={() => setIsPrescriptionOpen(false)}
        appointment={selectedAppointment}
        onSave={handleSavePrescription}
      />

      <PatientHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        data={historyData}
        loading={loadingHistory}
      />
    </div>
  )
}
