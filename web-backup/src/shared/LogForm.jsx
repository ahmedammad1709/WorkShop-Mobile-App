import { useMemo, useState } from 'react'
import { tasks } from './data.js'

function LogForm() {
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('17:00')
  const [taskId, setTaskId] = useState(tasks[0]?.id ?? '')
  const [tech, setTech] = useState('John Doe')

  const duration = useMemo(() => {
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    const startM = sh * 60 + sm
    const endM = eh * 60 + em
    const diff = Math.max(0, endM - startM)
    return (diff / 60).toFixed(2)
  }, [start, end])

  function handleSubmit(e) {
    e.preventDefault()
    // For now, just log
    console.log({ start, end, taskId, technician: tech, duration })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Technician</label>
        <input value={tech} onChange={(e)=>setTech(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Task</label>
        <select value={taskId} onChange={(e)=>setTaskId(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400">
          {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Start Time</label>
        <input type="time" value={start} onChange={(e)=>setStart(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">End Time</label>
        <input type="time" value={end} onChange={(e)=>setEnd(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400" />
      </div>
      <div className="space-y-1 lg:col-span-4">
        <div className="inline-flex items-center gap-2 text-sm bg-slate-100 px-3 py-2 rounded-md">Duration: <span className="font-medium">{duration} h</span></div>
      </div>
      <div className="lg:col-span-4">
        <button type="submit" className="px-4 py-2 rounded-lg bg-slate-900 text-white">Add Log</button>
      </div>
    </form>
  )
}

export default LogForm


