import Navbar from '../shared/Navbar.jsx'
import Sidebar from '../shared/Sidebar.jsx'
import LogForm from '../shared/LogForm.jsx'
import { dummyLogs } from '../shared/data.js'

function Logs() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <h2 className="text-xl font-semibold tracking-tight">Technician Time Log</h2>
          <LogForm />
          <section>
            <h3 className="text-base font-medium mb-3">Recent Logs</h3>
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="text-left p-3">Technician</th>
                    <th className="text-left p-3">Task</th>
                    <th className="text-left p-3">Start</th>
                    <th className="text-left p-3">End</th>
                    <th className="text-left p-3">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {dummyLogs.map((log) => (
                    <tr key={log.id} className="border-t">
                      <td className="p-3">{log.technician}</td>
                      <td className="p-3">{log.task}</td>
                      <td className="p-3">{log.start}</td>
                      <td className="p-3">{log.end}</td>
                      <td className="p-3">{log.duration}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default Logs


