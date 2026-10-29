import { useState } from 'react'

export default function PrescriptionModal({ isOpen, onClose, onSave, appointment }) {
  const [symptoms, setSymptoms] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [treatment, setTreatment] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [medicines, setMedicines] = useState([
    { name: '', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: 'After meals' },
  ])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen || !appointment) return null

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      { name: '', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: 'After meals' },
    ])
  }

  const handleRemoveMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index))
  }

  const handleChangeMedicine = (index, field, value) => {
    const updated = [...medicines]
    updated[index][field] = value
    setMedicines(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const validMedicines = medicines.filter((m) => m.name.trim() !== '')
    await onSave({
      symptoms,
      diagnosis,
      treatment,
      medicines: validMedicines,
      notes,
      followUpDate,
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Record Consultation & Prescription</h3>
            <p className="text-xs text-gray-500">
              Patient: <span className="font-semibold text-gray-700">{appointment.patient?.name || 'Patient'}</span> | {appointment.date} ({appointment.slot})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Clinical Diagnosis *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acute Viral Bronchitis, Hypertension Stage 1"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Recommended Follow-up Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Symptoms & Observations
            </label>
            <input
              type="text"
              placeholder="e.g. Dry cough, fever 101F, chest congestion since 3 days"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Treatment Plan & Dietary Advice
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Steam inhalation twice daily, drink warm water, avoid cold exposure."
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none focus:border-indigo-600 resize-none"
            ></textarea>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Prescribed Medications (Rx)
              </label>
              <button
                type="button"
                onClick={handleAddMedicine}
                className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
              >
                + Add Medicine
              </button>
            </div>

            <div className="space-y-2">
              {medicines.map((med, index) => (
                <div key={index} className="grid grid-cols-12 gap-1.5 items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <input
                    type="text"
                    placeholder="Medicine name (e.g. Amoxicillin 500mg)"
                    value={med.name}
                    onChange={(e) => handleChangeMedicine(index, 'name', e.target.value)}
                    className="col-span-4 text-xs bg-white border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-indigo-600"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Dosage (500mg)"
                    value={med.dosage}
                    onChange={(e) => handleChangeMedicine(index, 'dosage', e.target.value)}
                    className="col-span-2 text-xs bg-white border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-indigo-600"
                  />
                  <input
                    type="text"
                    placeholder="Freq (1-0-1)"
                    value={med.frequency}
                    onChange={(e) => handleChangeMedicine(index, 'frequency', e.target.value)}
                    className="col-span-2 text-xs bg-white border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-indigo-600"
                  />
                  <input
                    type="text"
                    placeholder="Duration (5 days)"
                    value={med.duration}
                    onChange={(e) => handleChangeMedicine(index, 'duration', e.target.value)}
                    className="col-span-2 text-xs bg-white border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-indigo-600"
                  />
                  <input
                    type="text"
                    placeholder="Instructions (After meals)"
                    value={med.instructions}
                    onChange={(e) => handleChangeMedicine(index, 'instructions', e.target.value)}
                    className="col-span-1 text-xs bg-white border border-gray-200 rounded-md px-1.5 py-1.5 outline-none focus:border-indigo-600"
                  />
                  <div className="col-span-1 text-center">
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(index)}
                        className="text-red-400 hover:text-red-600 text-sm font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Additional Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Return to OPD immediately if shortness of breath occurs."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save & Conclude Consultation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
