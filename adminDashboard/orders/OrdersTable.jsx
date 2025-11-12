function EditIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 19 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.3 6.925L12.05 2.725L13.45 1.325C13.8333 0.941667 14.3043 0.75 14.863 0.75C15.421 0.75 15.8917 0.941667 16.275 1.325L17.675 2.725C18.0583 3.10833 18.2583 3.571 18.275 4.113C18.2917 4.65433 18.1083 5.11667 17.725 5.5L16.3 6.925ZM14.85 8.4L4.25 19H0V14.75L10.6 4.15L14.85 8.4Z"
        fill="currentColor"
      />
    </svg>
  )
}

function OrdersTable({ orders, onEdit, onAccept, onDecline, showActions = false, showStatus = true }) {
  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="hidden sm:block">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[#29cc6a] text-white text-left">
              <th className="px-4 py-3 text-sm font-semibold">#Work Order</th>
              <th className="px-4 py-3 text-sm font-semibold">Order Details</th>
              <th className="px-4 py-3 text-sm font-semibold">Charges</th>
              {showActions ? (
                <th className="px-4 py-3 text-sm font-semibold">Actions</th>
              ) : showStatus ? (
                <th className="px-4 py-3 text-sm font-semibold">Status</th>
              ) : null}
              <th className="px-4 py-3 text-sm font-semibold">Updated At</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => (
              <tr
                key={order.id || idx}
                className="border-b border-gray-200 last:border-0 hover:bg-gray-50"
              >
                <td className="px-4 py-4 text-sm font-semibold">{order.id}</td>
                <td className="px-4 py-4 text-sm font-semibold">{order.title}</td>
                <td className="px-4 py-4 text-sm font-semibold">${order.charges}</td>
                {showActions ? (
                  <td className="px-4 py-4 text-sm font-semibold">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onAccept?.(order)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => onDecline?.(order)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </td>
                ) : showStatus ? (
                  <td className="px-4 py-4 text-sm font-semibold">{order.status}</td>
                ) : null}
                <td className="px-4 py-4 text-sm font-semibold">
                  <div className="flex flex-col">
                    <span>{new Date(order.updatedAt).toLocaleDateString()}</span>
                    <span className="text-black">{new Date(order.updatedAt).toLocaleTimeString()}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <button
                    onClick={() => onEdit(order)}
                    className="text-[#29cc6a] hover:text-[#1fa554] cursor-pointer"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 text-sm text-black font-semibold">
        <p>
          Showing 1 to {orders.length} of {orders.length} results
        </p>
        <div className="flex space-x-2">
          {/* <button
            disabled
            className="px-3 py-1 border-gray-300 border rounded text-gray-400 bg-gray-100 cursor-not-allowed"
          >
            Previous
          </button>
          <button className="px-3 py-1 border-gray-300 border rounded text-gray-600 hover:bg-gray-50 cursor-pointer">
            Next
          </button> */}
        </div>
      </div>
    </div>
  )
}

export default OrdersTable
