import { useState, useEffect } from 'react'

function OrderEditor({ order, onCancel, onSave }) {
  const [form, setForm] = useState(order)

  useEffect(() => setForm(order), [order])

  function updateField(k, v) {
    setForm(s => ({...s, [k]: v}))
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={e => updateField('title', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Charges</label>
        <input
          type="number"
          value={form.charges}
          onChange={e => updateField('charges', Number(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <select
          value={form.status}
          onChange={e => updateField('status', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option>Pending</option>
          <option>In Progress</option>
          <option>Completed</option>
        </select>
      </div>
      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 border rounded-md hover:bg-gray-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer"
        >
          Save Changes
        </button>
      </div>
    </div>
  )
}

export default OrderEditor