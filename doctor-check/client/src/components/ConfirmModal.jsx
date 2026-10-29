export default function ConfirmModal({ open, title, message, confirmText = 'Confirm', cancelText = 'Go back', onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-full border px-5 py-2 text-sm text-gray-600">
            {cancelText}
          </button>
          <button onClick={onConfirm} className="rounded-full bg-red-500 px-5 py-2 text-sm text-white">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}