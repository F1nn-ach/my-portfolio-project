interface StatCardProps {
  name: string
  value: string
  change: string
  trend: string // e.g. "up" | "down" | "stable"
}

export default function StatCard({ name, value, change, trend }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#040816]/20 p-6 space-y-2 relative overflow-hidden">
      <div className="absolute top-0 right-0 h-24 w-24 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{name}</span>
      <div className="flex items-baseline justify-between pt-1">
        <span className="text-2xl font-bold text-slate-100">{value}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          trend === "up" ? "bg-pink-500/10 text-pink-400" :
          trend === "down" ? "bg-sky-500/10 text-sky-400" :
          "bg-slate-500/10 text-slate-400"
        }`}>
          {change}
        </span>
      </div>
    </div>
  )
}
