import { useState } from "react"

function RepairForm({ onCancel, onSubmit }) {
  const [form, setForm] = useState({
    repairInfo: "",
    activityType: "",
    charges: "",
    status: "Requested",
    isStatusOpen: false,
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSubmit) onSubmit(form)
  }

  return (
    <div className="bg-white rounded-md border-t-2 border-[#29cc6a] shadow-sm p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Repair Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Repair Information</h2>
            <p className="text-sm text-gray-500">Fill up required information.</p>
          </div>
          <div>
            <input
              type="text"
              name="repairInfo"
              value={form.repairInfo}
              onChange={handleChange}
              className="w-full border-gray-200 border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#29cc6a]"
            />
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Description & Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-semibold text-gray-900">Description</h3>
            <p className="text-sm text-gray-500">Fill up required information.</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Activity Type</label>
              <input
                type="text"
                name="activityType"
                value={form.activityType}
                onChange={handleChange}
                className="w-full border-gray-200 border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#29cc6a]"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Charges</label>
              <input
                type="number"
                name="charges"
                value={form.charges}
                onChange={handleChange}
                className="w-full border-gray-200 border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#29cc6a]"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Status</label>
              <div className="relative inline-block w-40">
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, isStatusOpen: !prev.isStatusOpen }))}
                  className="w-full bg-white border-gray-200 border rounded-md pl-3 pr-8 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#29cc6a] focus:border-[#29cc6a] text-left text-gray-700 cursor-pointer"
                >
                  {form.status}
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#29cc6a]">
                    <svg 
                      className={`h-4 w-4 transition-transform duration-200 ${form.isStatusOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </button>
                {form.isStatusOpen && (
                  <div className="absolute z-10 w-full bottom-full mb-1 bg-white border border-gray-200 rounded-md shadow-lg transform origin-bottom transition-all duration-150 max-h-48 overflow-y-auto custom-scrollbar">
                    {['Requested', 'In Progress', 'Completed', 'Pending'].map((status) => (
                      <div
                        key={status}
                        onClick={() => {
                          setForm(prev => ({ 
                            ...prev, 
                            status, 
                            isStatusOpen: false 
                          }));
                        }}
                        className={`px-3 py-2 cursor-pointer hover:bg-[#29cc6a] hover:text-white transition-colors duration-150
                          ${form.status === status ? 'bg-[#29cc6a] text-white' : 'text-gray-700'}
                          ${status === 'Pending' ? 'rounded-b-md' : ''}
                          ${status === 'Requested' ? 'rounded-t-md' : ''}`}
                      >
                        {status}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 rounded-md bg-gray-200 text-gray-800 shadow hover:bg-gray-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-md border border-gray-200 text-gray-800 hover:bg-gray-100 cursor-pointer"
          >
            Update
          </button>
        </div>
      </form>
    </div>
  )
}

export default RepairForm
