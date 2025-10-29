function ReportTable({ rows }) {
  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
      <table className="w-full min-w-[700px] text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="text-left p-3">Technician</th>
            <th className="text-left p-3">Task</th>
            <th className="text-left p-3">Date</th>
            <th className="text-left p-3">Duration</th>
            <th className="text-left p-3">Cost</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-3">{r.technician}</td>
              <td className="p-3">{r.task}</td>
              <td className="p-3">{r.date}</td>
              <td className="p-3">{r.duration}h</td>
              <td className="p-3">${r.cost.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ReportTable


