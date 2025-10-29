function KpiCard({ title, value }) {
  return (
    <div className="bg-white border-t-2 border-[#29cc6a] rounded-sm p-4 text-center">
      <div className="text-sm text-black">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  )
}

export default KpiCard
