import React, { useEffect, useMemo, useState, useCallback } from 'react'
import OrdersTable from './OrdersTable'
import OrderEditor from './OrderEditor'
import RepairTypesList from '../../../components/RepairTypesList'

const DEFAULT_ORDER = ['Requested', 'In Process', 'Completed', 'Pending']

function FilterIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3 5h14l-5 6v4l-4 2v-6L3 5z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

export default function OrdersMultiTable({ orders: initialOrders, onEdit, selectedCategory }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orders, setOrders] = useState(initialOrders || [])
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsData, setDetailsData] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null, order: null })
  const closeConfirm = () => setConfirmModal({ open: false, type: null, order: null })
  const categories = DEFAULT_ORDER

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  const base = (API_URL || '').replace(/\/+$/, '')
  const listEndpoint = /\/api\/?$/.test(base) ? `${base}/work-orders` : `${base}/api/work-orders`

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(listEndpoint)
      const ct = res.headers.get('content-type') || ''
      const isJson = ct.includes('application/json')
      const data = isJson ? await res.json() : null
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || res.statusText)
      }
      setOrders(Array.isArray(data.orders) ? data.orders : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [listEndpoint])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const detailsEndpoint = (id) => (/\/api\/?$/.test(base) ? `${base}/work-orders/${id}` : `${base}/api/work-orders/${id}`)
  const statusEndpoint = (id) => (/\/api\/?$/.test(base) ? `${base}/work-orders/${id}/status` : `${base}/api/work-orders/${id}/status`)
  const deleteEndpoint = (id) => (/\/api\/?$/.test(base) ? `${base}/work-orders/${id}` : `${base}/api/work-orders/${id}`)

  const handleAccept = (order) => {
    setConfirmModal({ open: true, type: 'accept', order })
  }

  const handleDecline = (order) => {
    setConfirmModal({ open: true, type: 'decline', order })
  }

  const performConfirm = async () => {
    const { type, order } = confirmModal
    if (!type || !order) return closeConfirm()
    try {
      if (type === 'accept') {
        const res = await fetch(statusEndpoint(order.id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'pending' })
        })
        const data = await res.json()
        if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to accept')
      } else if (type === 'decline') {
        const res = await fetch(deleteEndpoint(order.id), { method: 'DELETE' })
        const data = await res.json()
        if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to delete')
      }
      await fetchOrders()
      closeConfirm()
    } catch (e) {
      console.error(e)
      closeConfirm()
      alert('Action failed. Please try again.')
    }
  }

  const handleEdit = async (order) => {
    setDetailsOpen(true)
    setDetailsData(null)
    try {
      const res = await fetch(detailsEndpoint(order.id))
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to load details')
      setDetailsData(data)
    } catch (e) {
      console.error(e)
      alert('Failed to load work order details.')
    }
  }

  const orderedCategories = useMemo(() => {
    if (!selectedCategory) return categories
    return [selectedCategory, ...categories.filter(c => c !== selectedCategory)]
  }, [categories, selectedCategory])

  return (
    <div className="space-y-6">
      {loading && (
        <div className="p-4 text-sm text-gray-600">Loading work orders…</div>
      )}
      {error && (
        <div className="p-4 text-sm text-red-600">Failed to load: {error}</div>
      )}
      {!loading && !error && orderedCategories.map((cat) => {
        const catOrders = orders.filter(o => o.status === cat)
        return (
          <div key={cat} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-md sm:text-lg font-semibold text-black">{cat}</h3>
            </div>
            <div className="overflow-x-auto">
              {catOrders.length > 0 ? (
                <OrdersTable
                  orders={catOrders}
                  onEdit={handleEdit}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  showActions={cat === 'Requested'}
                  showStatus={cat !== 'Requested'}
                />
              ) : (
                <div className="px-4 py-6 text-sm text-gray-500">{`No ${cat} Work Orders`}</div>
              )}
            </div>
          </div>
        )
      })}
      {detailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Work Order Details</h3>
                  {detailsData?.order && (
                    <div className="text-sm text-gray-500 mt-1">
                      {detailsData.order.customer} • {detailsData.order.vehicle} • VIN: {detailsData.order.vin || 'N/A'}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setDetailsOpen(false)} 
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {!detailsData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading work order details...</span>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Overview Section */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Overview
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Work Order ID</div>
                          <div className="text-sm font-semibold text-gray-900 mt-1">{detailsData.order?.id}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</div>
                          <div className="mt-1">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              detailsData.order?.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              detailsData.order?.status === 'In Process' ? 'bg-blue-100 text-blue-800' :
                              detailsData.order?.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {detailsData.order?.status}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</div>
                          <div className="text-sm font-medium text-gray-900 mt-1">{detailsData.order?.customer}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vehicle</div>
                          <div className="text-sm font-medium text-gray-900 mt-1">{detailsData.order?.vehicle}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">VIN</div>
                          <div className="text-sm text-gray-900 mt-1">{detailsData.order?.vin || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Activity Type</div>
                          <div className="text-sm text-gray-900 mt-1">{detailsData.order?.activity_type || 'N/A'}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Charges</div>
                          <div className="text-lg font-bold text-green-600 mt-1">${Number(detailsData.order?.quote_total || 0).toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date Created</div>
                          <div className="text-sm text-gray-900 mt-1">{detailsData.order?.created_at ? new Date(detailsData.order.created_at).toLocaleDateString() : 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Description Section */}
                  {detailsData.order?.activity_description && (
                    <div className="bg-blue-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Activity Description
                      </h4>
                      <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                        {detailsData.order.activity_description}
                      </div>
                    </div>
                  )}

                  {/* Repair Types Section */}
                  <div className="bg-purple-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Repair Types
                    </h4>
                    <RepairTypesList repairTypes={detailsData.order?.repairs_json} />
                  </div>

                  {/* Paint Codes Section */}
                  {detailsData.order?.paint_codes_json && Array.isArray(detailsData.order.paint_codes_json) && detailsData.order.paint_codes_json.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                        </svg>
                        Paint Codes ({detailsData.order.paint_codes_json.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {detailsData.order.paint_codes_json.map((paintCode, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                {paintCode.code}
                              </span>
                              {paintCode.triStage && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                  Tri Stage
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              Quantity: <span className="font-medium text-gray-900">{paintCode.quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Items Section */}
                    <div className="bg-green-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        Items ({Array.isArray(detailsData.items) ? detailsData.items.length : 0})
                      </h4>
                      {Array.isArray(detailsData.items) && detailsData.items.length > 0 ? (
                        <div className="space-y-3">
                          {detailsData.items.map((item, i) => (
                            <div key={i} className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                {Object.entries(item).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                                    <span className="ml-2 text-gray-900">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="text-sm text-gray-500">No items found for this work order</p>
                        </div>
                      )}
                    </div>

                    {/* Work Types Section */}
                    <div className="bg-orange-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        Work Types ({Array.isArray(detailsData.work_types) ? detailsData.work_types.length : 0})
                      </h4>
                      {Array.isArray(detailsData.work_types) && detailsData.work_types.length > 0 ? (
                        <div className="space-y-2">
                          {detailsData.work_types.map((workType, i) => (
                            <div key={i} className="bg-white px-4 py-3 rounded-lg border border-orange-200 shadow-sm">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                                <span className="text-sm font-medium text-gray-900">
                                  {workType.work_type_title || workType.work_type_id || workType.type || workType.name || 'Unknown Work Type'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          <p className="text-sm text-gray-500">No work types assigned</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Photos Section */}
                  <div className="bg-indigo-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Photos ({Array.isArray(detailsData.photos) ? detailsData.photos.length : 0})
                    </h4>
                    {Array.isArray(detailsData.photos) && detailsData.photos.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {detailsData.photos.map((photo, i) => (
                          <div key={i} className="bg-white rounded-lg border border-indigo-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            {photo.url || photo.path ? (
                              <img 
                                src={photo.url || photo.path} 
                                alt={`Work Order Photo ${i + 1}`} 
                                className="w-full h-32 object-cover hover:scale-105 transition-transform cursor-pointer" 
                              />
                            ) : (
                              <div className="p-3 text-xs text-gray-600 h-32 flex items-center justify-center">
                                {JSON.stringify(photo)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-500">No photos available</p>
                      </div>
                    )}
                  </div>


                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 flex items-center justify-center rounded-full ${confirmModal.type === 'accept' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {confirmModal.type === 'accept' ? '✔' : '✕'}
              </div>
              <h3 className="text-lg font-semibold text-black">
                {confirmModal.type === 'accept' ? 'Accept Work Order' : 'Decline Work Order'}
              </h3>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              {confirmModal.type === 'accept'
                ? 'By accepting, this work order will be forwarded to a technician and moved to Pending.'
                : 'Declining will permanently delete this work order and all related records.'}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={closeConfirm} className="px-4 py-2 border rounded-md hover:bg-gray-50 cursor-pointer">Cancel</button>
              <button
                onClick={performConfirm}
                className={`px-4 py-2 rounded-md text-white cursor-pointer ${confirmModal.type === 'accept' ? 'bg-[#29cc6a] hover:bg-[#25b75f]' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {confirmModal.type === 'accept' ? 'Accept' : 'Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}