import { useState, useEffect } from 'react'
import Sidebar from './layout/Sidebar'
import Header from './layout/Header'
// import OrdersTable from './orders/OrdersTable'
import OrdersMultiTable from './orders/OrdersMultiTable'
import KpiCard from './components/KpiCard'
import Sparkline from './components/Sparkline'
import Modal from './components/Modal'
import OrderEditor from './orders/OrderEditor'
import RepairForm from './orders/RepairForm'
import UserPanel from './components/UserPanel'
import ManagementSection from './users/UserManagement'
import Roles from './users/Roles'
import Settings from './settings/Settings'

export default function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState('Dashboard')
  const [kpiData, setKpiData] = useState({
    contractors: 0,
    technicians: 0,
    suppliers: 0,
    cancelledOrders: 0,
    completedOrders: 0,
    inProgressOrders: 0
  })
  const [orderFilter, setOrderFilter] = useState(null)
  const [orders, setOrders] = useState([
    {
      id: 'ORD-001',
      title: 'Engine repair and breaks repair',
      charges: 450,
      status: 'In Progress',
      updatedAt: '2024-01-15'
    },
    {
      id: 'ORD-002',
      title: 'Engine repair and breaks repair',
      charges: 200,
      status: 'Completed',
      updatedAt: '2024-01-14'
    },
    {
      id: 'ORD-003',
      title: 'Engine repair and breaks repair',
      charges: 80,
      status: 'Pending',
      updatedAt: '2024-01-13'
    }
  ])
  const [showModal, setShowModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [isEditingRepair, setIsEditingRepair] = useState(false)
  const [userManagementState, setUserManagementState] = useState({
    activeSection: 'main',
    selectedContractor: null
  })
  const [userRolesState, setUserRolesState] = useState({
    editingRole: null
  })
  const [settingsState, setSettingsState] = useState({
    selectedSetting: null,
    workOrderSetting: null,
    editingActivity: null
  })

  // Fetch KPI data on component mount
  useEffect(() => {
    const fetchKpiData = async () => {
      try {
        // Fetch user counts by role
        const rolesResponse = await fetch('/api/auth/roles-stats')
        const rolesData = await rolesResponse.json()
        
        // Fetch work order counts by status
        const statusResponse = await fetch('/api/work-orders/status-stats')
        const statusData = await statusResponse.json()

        if (rolesData.success && statusData.success) {
          const roleStats = rolesData.stats.reduce((acc, stat) => {
            acc[stat.role] = stat.count
            return acc
          }, {})

          const statusStats = statusData.stats.reduce((acc, stat) => {
            acc[stat.status] = stat.count
            return acc
          }, {})

          setKpiData({
            contractors: roleStats.contractor || 0,
            technicians: roleStats.technician || 0,
            suppliers: roleStats.supplier || 0,
            cancelledOrders: statusStats.cancelled || 0,
            completedOrders: statusStats.completed || 0,
            inProgressOrders: statusStats['in_progress'] || statusStats.in_progress || 0
          })
        }
      } catch (error) {
        console.error('Error fetching KPI data:', error)
      }
    }

    fetchKpiData()
  }, [])

  const handleAddOrder = () => {
    setEditingOrder(null)
    setShowModal(true)
  }

  const handleEditOrder = (order) => {
    setEditingOrder(order)
    setShowModal(true)
  }

  const handleEditRepair = (order) => {
    setEditingOrder(order)
    setIsEditingRepair(true)
    setActiveMenu('Orders')
  }

  const handleCancelRepair = () => {
    setIsEditingRepair(false)
    setEditingOrder(null)
  }

  const handleSaveOrder = (orderData) => {
    if (editingOrder) {
      // Update existing order
      setOrders(orders.map(order =>
        order.id === editingOrder.id ? { ...order, ...orderData } : order
      ))
    } else {
      // Add new order
      const newOrder = {
        id: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
        ...orderData,
        updatedAt: new Date().toISOString().split('T')[0]
      }
      setOrders([...orders, newOrder])
    }
    setShowModal(false)
    setEditingOrder(null)
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'Orders':
        if (isEditingRepair && editingOrder) {
          return (
            <RepairForm
              order={editingOrder}
              onCancel={handleCancelRepair}
              onSave={(updatedOrder) => {
                setOrders(orders.map(order =>
                  order.id === editingOrder.id ? { ...order, ...updatedOrder } : order
                ))
                setIsEditingRepair(false)
                setEditingOrder(null)
              }}
            />
          )
        }
        return (
          <div className="space-y-6">
            <OrdersMultiTable orders={orders} onEdit={handleEditRepair} selectedCategory={orderFilter} />
          </div>
        )
      case 'Dashboard':
        return (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <KpiCard title="Contractors" value={kpiData.contractors} />
              <KpiCard title="Technicians" value={kpiData.technicians} />
              <KpiCard title="Suppliers" value={kpiData.suppliers} />
              <KpiCard title="Cancelled Orders" value={kpiData.cancelledOrders} />
            </div>

            {/* Additional KPI Cards for Work Order Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
              <KpiCard title="Completed Orders" value={kpiData.completedOrders} />
              <KpiCard title="In Progress Orders" value={kpiData.inProgressOrders} />
            </div>


            {/* Charts */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h3 className="text-lg font-semibold mb-4">Annual Sales</h3>
                <div className="w-full">
                  <Sparkline />
                </div>
              </div>
              {/* <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Order Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Completed</span>
                    <span className="font-semibold">16</span>
                  </div>
                  <div className="flex justify-between">
                    <span>In Progress</span>
                    <span className="font-semibold">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending</span>
                    <span className="font-semibold">5</span>
                  </div>
                </div>
              </div> */}
            </div>

            {/* Orders Table section removed - only shown in Orders tab */}
          </div>
        )
      case 'User Management':
        return (
            <div className="overflow-x-auto">
              <ManagementSection 
                userManagementState={userManagementState}
                setUserManagementState={setUserManagementState}
              />
            </div>
        )
      case 'User Roles':
        return (
          <div className="bg-white rounded-lg shadow">
            <Roles 
              userRolesState={userRolesState}
              setUserRolesState={setUserRolesState}
            />
          </div>
        )
      case 'Settings':
        return (
          <div className="bg-white rounded-lg shadow">
            <Settings 
              settingsState={settingsState}
              setSettingsState={setSettingsState}
            />
          </div>
        )
      default:
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Dashboard</h3>
            <p className="text-gray-600">Welcome to the admin dashboard.</p>
          </div>
        )
    }
  }

  const handleMenuClick = (menuItem) => {
    // If clicking the same menu item that's already active
    if (activeMenu === menuItem) {
      // If we're editing an order, clear the editing state
      if (menuItem === 'Orders' && (isEditingRepair || editingOrder)) {
        setIsEditingRepair(false)
        setEditingOrder(null)
      }
      // If we're in User Management sub-sections, reset to main
      if (menuItem === 'User Management' && (userManagementState.activeSection !== 'main' || userManagementState.selectedContractor)) {
        setUserManagementState({
          activeSection: 'main',
          selectedContractor: null
        })
      }
      // If we're in User Roles editing, reset to main
      if (menuItem === 'User Roles' && userRolesState.editingRole) {
        setUserRolesState({
          editingRole: null
        })
      }
      // If we're in Settings sub-sections, reset to main
      if (menuItem === 'Settings' && settingsState.selectedSetting) {
        setSettingsState({
          selectedSetting: null
        })
      }
    } else {
      // If clicking a different menu item, set it as active
      setActiveMenu(menuItem)
      // Reset any editing states
      setIsEditingRepair(false)
      setEditingOrder(null)
      setUserManagementState({
        activeSection: 'main',
        selectedContractor: null
      })
      setUserRolesState({
        editingRole: null
      })
      setSettingsState({
        selectedSetting: null
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row">
        <Sidebar activeMenu={activeMenu} setActiveMenu={handleMenuClick} />
        <div className="flex-1 lg:ml-0 w-full overflow-hidden">
          {(() => {
            let headerTitle = activeMenu
            let headerIconKey = null

            const baseIconMap = {
              'Dashboard': 'dashboard',
              'Orders': 'orders',
              'User Management': 'users',
              'User Roles': 'roles',
              'Settings': 'settings'
            }
            headerIconKey = baseIconMap[activeMenu] || 'dashboard'

            if (activeMenu === 'User Management') {
              if (userManagementState.selectedContractor) {
                headerTitle = 'Account Information'
                headerIconKey = 'account'
              } else if (userManagementState.activeSection === 'contractor') {
                headerTitle = 'Contractor Management'
                headerIconKey = 'contractor'
              } else if (userManagementState.activeSection === 'technician') {
                headerTitle = 'Technician Management'
                headerIconKey = 'technician'
              } else if (userManagementState.activeSection === 'supplier') {
                headerTitle = 'Supplier Management'
                headerIconKey = 'supplier'
              } else {
                headerTitle = 'User Management'
                headerIconKey = 'users'
              }
            }

            if (activeMenu === 'User Roles' && userRolesState.editingRole) {
              headerTitle = 'Edit User Role'
              headerIconKey = 'roles'
            }

            if (activeMenu === 'Settings') {
              if (settingsState.editingActivity) {
                headerTitle = settingsState.editingActivity.name
                headerIconKey = 'settings'
              } else if (settingsState.workOrderSetting) {
                headerTitle = settingsState.workOrderSetting
                headerIconKey = 'settings'
              } else if (settingsState.selectedSetting === 'Profile Settings') {
                headerTitle = 'Profile Settings'
                headerIconKey = 'settings'
              } else if (settingsState.selectedSetting === 'Work Order Settings') {
                headerTitle = 'Work Order Settings'
                headerIconKey = 'settings'
              } else if (settingsState.selectedSetting === 'Labor Rates') {
                headerTitle = 'Labor Rates'
                headerIconKey = 'settings'
              } else if (settingsState.selectedSetting === 'Price/Margin Management') {
                headerTitle = 'Price/Margin Management'
                headerIconKey = 'settings'
              } else {
                headerTitle = 'Settings'
                headerIconKey = 'settings'
              }
            }

            return (
              <Header
                onAddOrder={handleAddOrder}
                activeMenu={activeMenu}
                editingOrder={isEditingRepair ? editingOrder : null}
                onBack={() => {
                  if (activeMenu !== 'Settings') return
                  if (settingsState.workOrderSetting) {
                    setSettingsState(prev => ({ ...prev, workOrderSetting: null }))
                    return
                  }
                  if (settingsState.selectedSetting) {
                    setSettingsState(prev => ({ ...prev, selectedSetting: null }))
                    return
                  }
                }}
                headerTitle={headerTitle}
                headerIconKey={headerIconKey}
                selectedCategory={orderFilter}
                onSelectCategory={setOrderFilter}
              />
            )
          })()
          }
          <main className="p-2 sm:p-3 md:p-4 lg:p-6 max-w-full">
            {renderContent()}
          </main>
        </div>
      </div>

      {/* Modal for adding/editing orders */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <OrderEditor
            order={editingOrder}
            onSave={handleSaveOrder}
            onCancel={() => setShowModal(false)}
          />
        </Modal>
      )}
    </div>
  )
}
