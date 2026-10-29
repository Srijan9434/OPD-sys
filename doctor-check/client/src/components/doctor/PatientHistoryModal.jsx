export default function PatientHistoryModal({ isOpen, onClose, data, loading }) {
  if (!isOpen) return null

  const patient = data?.patient
  const appointments = data?.appointments || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Patient Medical History</h3>
            {patient && (
              <p className="text-xs text-gray-500">
                {patient.name} ({patient.email} | {patient.phone || 'No phone'})
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading visit history...</div>
        ) : (
          <div className="mt-4 space-y-4">
            {appointments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No previous consultations found for this patient.</p>
            ) : (
              appointments.map((apt) => (
                <div
                  key={apt._id}
                  className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">
                      {apt.date} at {apt.slot}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-medium ${
                        apt.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : apt.status === 'confirmed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>

                  {apt.reason && (
                    <p className="text-xs text-gray-600">
                      <strong className="text-gray-700">Reason:</strong> {apt.reason}
                    </p>
                  )}

                  {apt.prescription?.medicines?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Prescription:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {apt.prescription.medicines.map((m, idx) => (
                          <li key={idx}>
                            • <span className="font-medium text-gray-800">{m.name}</span> — {m.dosage} ({m.duration})
                          </li>
                        ))}
                      </ul>
                      {apt.prescription.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          Advice: {apt.prescription.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        <div className="flex justify-end pt-4 mt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
