import React, { useState } from 'react'
import { INCIDENT_TYPE_OPTIONS, MONTH_OPTIONS, YEAR_OPTIONS } from './incidentCsvParser.js'

function IncidentSearchFilterBar({
  onSearchSubmit,
  typeFilter,
  onTypeChange,
  yearFilter,
  onYearChange,
  monthFilter,
  onMonthChange,
  onReset,
}) {
  const [inputText, setInputText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearchSubmit(inputText)
  }

  const handleClear = () => {
    setInputText('')
    onReset()
  }

  return (
    <div className="flex flex-wrap justify-between items-center border-b border-zinc-800 pb-2.5 gap-2">
      {/* Search Input + Search Button */}
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5 w-full max-w-sm">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Search record ID, barangay, or landmark..."
          className="bg-zinc-800/70 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 flex-1 focus:outline-none focus:border-zinc-500"
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold cursor-pointer transition-colors"
        >
          Search
        </button>
        {(inputText || typeFilter !== 'all' || yearFilter !== 'all' || monthFilter !== 'all') && (
          <button
            type="button"
            onClick={handleClear}
            className="px-2.5 py-1.5 rounded bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 text-xs cursor-pointer transition-colors"
          >
            Reset
          </button>
        )}
      </form>

      {/* Dropdown Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          className="bg-zinc-800/70 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
        >
          <option value="all">All Incident Types</option>
          {INCIDENT_TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={yearFilter}
          onChange={(e) => onYearChange(e.target.value)}
          className="bg-zinc-800/70 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
        >
          <option value="all">All Years</option>
          {YEAR_OPTIONS.map((yr) => (
            <option key={yr} value={yr}>
              {yr}
            </option>
          ))}
        </select>

        <select
          value={monthFilter}
          onChange={(e) => onMonthChange(e.target.value)}
          className="bg-zinc-800/70 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
        >
          <option value="all">All Months</option>
          {MONTH_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default IncidentSearchFilterBar