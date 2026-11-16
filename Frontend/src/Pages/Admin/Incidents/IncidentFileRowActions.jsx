import React from 'react'

function IncidentFileRowActions({ record, onReview, onEdit, onArchive }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onReview?.(record)}
        className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-xs border border-emerald-500/20 cursor-pointer"
      >
        Review
      </button>

      <button
        type="button"
        onClick={() => onEdit?.(record)}
        className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-xs border border-blue-500/20 cursor-pointer"
      >
        Edit
      </button>

      <button
        type="button"
        onClick={() => onArchive?.(record)}
        className="px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs border border-red-500/20 cursor-pointer"
      >
        Archive
      </button>
    </div>
  )
}

export default IncidentFileRowActions