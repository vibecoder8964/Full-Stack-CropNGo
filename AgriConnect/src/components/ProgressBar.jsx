export default function ProgressBar({ current, total, labels = [] }) {
  return (
    <div className="px-6 py-4 bg-cream-50 border-b border-cream-200">
      <div className="h-2 w-full bg-cream-200 rounded-full overflow-hidden mb-3">
        <div 
          className="h-full bg-forest-500 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>
      <div className="flex justify-between items-center text-xs font-body font-semibold">
        <span className="text-bark-400">Step {current + 1} of {total}</span>
        {labels[current] && <span className="text-forest-600">{labels[current]}</span>}
      </div>
    </div>
  )
}
