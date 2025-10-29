import Navbar from '../shared/Navbar.jsx'
import Sidebar from '../shared/Sidebar.jsx'
import ReportTable from '../shared/ReportTable.jsx'
import { dummyLogs } from '../shared/data.js'

function Reports() {
  function handleExport(type) {
    // Hooks for future backend integration
    console.log(`Exporting ${type}...`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-xl font-semibold tracking-tight">Reports</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => handleExport('pdf')} className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm">Export PDF</button>
              <button onClick={() => handleExport('excel')} className="px-3 py-2 rounded-lg border text-sm">Export Excel</button>
            </div>
          </div>
          <ReportTable rows={dummyLogs} />
        </main>
      </div>
    </div>
  )
}

export default Reports


