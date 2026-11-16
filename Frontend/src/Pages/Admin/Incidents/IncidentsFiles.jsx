import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getIncidentWSUrl,
  getResolvedIncidents,
  importIncidentsCsv,
} from './IncidentApi.js'
import IncidentSearchFilterBar from './IncidentSearchFilterBar.jsx'
import IncidentFileRowActions from './IncidentFileRowActions.jsx'

const ITEMS_PER_PAGE = 5

function IncidentsFiles({ onSeeAll }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [statusBanner, setStatusBanner] = useState({ type: '', text: '' })

  const fileInputRef = useRef(null)

  // 1. Load resolved records directly from MongoDB `incidents` collection
  const fetchResolvedRecords = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getResolvedIncidents()
      setRecords(data)
    } catch (err) {
      setStatusBanner({
        type: 'error',
        text: err.message || 'Failed to load incidents from database.',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchResolvedRecords()
  }, [fetchResolvedRecords])

  // 2. Listen for newly resolved SOS incidents via WebSocket so future incidents appear automatically
  useEffect(() => {
    const ws = new WebSocket(getIncidentWSUrl())

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.event === 'INCIDENT_STATUS_UPDATED' && payload.data?.status === 'resolved') {
          fetchResolvedRecords()
        }
      } catch (err) {
        console.error('IncidentsFiles WS error:', err)
      }
    }

    return () => ws.close()
  }, [fetchResolvedRecords])

  // 3. Upload CSV to backend -> stores in MongoDB `incidents` collection -> refreshes table
  const handleFileImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setStatusBanner({ type: '', text: '' })

    try {
      const res = await importIncidentsCsv(file)
      await fetchResolvedRecords()
      setPage(1)
      setStatusBanner({
        type: 'success',
        text: `Imported ${res.total_processed} records (${res.inserted} new, ${res.updated} updated) into incidents collection.`,
      })
    } catch (err) {
      setStatusBanner({
        type: 'error',
        text: err.message || 'Failed to import CSV file.',
      })
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  // 4. Filter records
  const filteredRecords = useMemo(() => {
    const term = searchQuery.trim().toLowerCase()
    return records.filter((row) => {
      const matchesType = typeFilter === 'all' || row.incident_type === typeFilter
      const matchesYear = yearFilter === 'all' || String(row.year) === yearFilter
      const matchesMonth = monthFilter === 'all' || String(row.month) === monthFilter
      const matchesSearch =
        !term ||
        String(row.source_record_id).toLowerCase().includes(term) ||
        String(row.barangay).toLowerCase().includes(term) ||
        String(row.incident_type).toLowerCase().includes(term) ||
        String(row.landmark_reference).toLowerCase().includes(term) ||
        String(row.accident_date).toLowerCase().includes(term)

      return matchesType && matchesYear && matchesMonth && matchesSearch
    })
  }, [records, searchQuery, typeFilter, yearFilter, monthFilter])

  const pages = Math.max(1, Math.ceil(filteredRecords.length / ITEMS_PER_PAGE))
  const safePage = Math.min(page, pages)
  const paginatedRecords = filteredRecords.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  )

  const handleResetFilters = () => {
    setSearchQuery('')
    setTypeFilter('all')
    setYearFilter('all')
    setMonthFilter('all')
    setPage(1)
  }

  // Placeholder action handlers (UI hooks only — backend to be wired later)
  const handleReviewAction = (record) => {
    setStatusBanner({ type: 'info', text: `Review selected for ${record.source_record_id}` })
  }

  const handleEditAction = (record) => {
    setStatusBanner({ type: 'info', text: `Edit selected for ${record.source_record_id}` })
  }

  const handleArchiveAction = (record) => {
    setStatusBanner({ type: 'info', text: `Archive selected for ${record.source_record_id}` })
  }

  return (
    <div className="bg-zinc-900 border rounded border-zinc-800 w-full h-[55vh] p-3 flex flex-col gap-2 text-white">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white">Incident Files</h2>
          <span className="px-2 py-0.5 rounded-full bg-green-400/15 text-green-400 text-[10px] font-semibold">
            {filteredRecords.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            type="button"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
          >
            {importing ? 'Importing...' : 'Import CSV'}
          </button>

          <button
            type="button"
            onClick={() => (onSeeAll ? onSeeAll() : handleResetFilters())}
            className="flex gap-1 items-center text-xs text-zinc-400 hover:text-zinc-300 cursor-pointer transition-colors duration-300"
          >
            <span>See All</span>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              arrow_right_alt
            </span>
          </button>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <IncidentSearchFilterBar
        onSearchSubmit={(query) => {
          setSearchQuery(query)
          setPage(1)
        }}
        typeFilter={typeFilter}
        onTypeChange={(val) => {
          setTypeFilter(val)
          setPage(1)
        }}
        yearFilter={yearFilter}
        onYearChange={(val) => {
          setYearFilter(val)
          setPage(1)
        }}
        monthFilter={monthFilter}
        onMonthChange={(val) => {
          setMonthFilter(val)
          setPage(1)
        }}
        onReset={handleResetFilters}
      />

      {/* Feedback Banner */}
      {statusBanner.text && (
        <p
          className={`text-xs rounded px-2.5 py-1.5 border ${
            statusBanner.type === 'error'
              ? 'text-red-400 border-red-500/30 bg-red-500/10'
              : statusBanner.type === 'success'
              ? 'text-green-400 border-green-500/30 bg-green-500/10'
              : 'text-zinc-300 border-zinc-700 bg-zinc-800/70'
          }`}
        >
          {statusBanner.text}
        </p>
      )}

      {/* Table Matching CSV Columns & `incidents` Collection */}
      <div className="max-w-[140vh] flex overflow-y-auto overflow-x-auto rounded border border-zinc-800">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-zinc-800/70 text-zinc-400 text-xs uppercase sticky top-0">
            <tr>
              <th className="px-3 py-2.5 font-semibold">source_record_id</th>
              <th className="px-3 py-2.5 font-semibold">accident_date</th>
              <th className="px-3 py-2.5 font-semibold">year</th>
              <th className="px-3 py-2.5 font-semibold">month</th>
              <th className="px-3 py-2.5 font-semibold">incident_type</th>
              <th className="px-3 py-2.5 font-semibold">barangay</th>
              <th className="px-3 py-2.5 font-semibold">latitude</th>
              <th className="px-3 py-2.5 font-semibold">longitude</th>
              <th className="px-3 py-2.5 font-semibold">landmark_reference</th>
              <th className="px-3 py-2.5 font-semibold">status</th>
              <th className="px-3 py-2.5 font-semibold text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800">
            {!loading &&
              paginatedRecords.map((row) => (
                <tr key={row.source_record_id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-3 py-3 font-mono text-xs font-medium text-zinc-200">
                    {row.source_record_id}
                  </td>

                  <td className="px-3 py-3 text-xs text-zinc-300">{row.accident_date}</td>

                  <td className="px-3 py-3 text-xs text-zinc-400">{row.year}</td>

                  <td className="px-3 py-3 text-xs text-zinc-400">{row.month}</td>

                  <td className="px-3 py-3 text-xs text-zinc-200 font-medium">
                    {row.incident_type}
                  </td>

                  <td className="px-3 py-3 text-xs text-zinc-300">{row.barangay}</td>

                  <td className="px-3 py-3 font-mono text-xs text-zinc-400">
                    {typeof row.latitude === 'number' ? row.latitude.toFixed(6) : row.latitude}
                  </td>

                  <td className="px-3 py-3 font-mono text-xs text-zinc-400">
                    {typeof row.longitude === 'number' ? row.longitude.toFixed(6) : row.longitude}
                  </td>

                  <td
                    title={row.landmark_reference}
                    className="px-3 py-3 text-xs text-zinc-400 max-w-[220px] truncate"
                  >
                    {row.landmark_reference}
                  </td>

                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-400/20 text-green-400">
                      {row.status}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <IncidentFileRowActions
                      record={row}
                      onReview={handleReviewAction}
                      onEdit={handleEditAction}
                      onArchive={handleArchiveAction}
                    />
                  </td>
                </tr>
              ))}

            {loading && (
              <tr>
                <td colSpan="11" className="text-center py-8 text-xs text-zinc-500">
                  Loading incidents from database...
                </td>
              </tr>
            )}

            {!loading && paginatedRecords.length === 0 && (
              <tr>
                <td colSpan="11" className="text-center py-8 text-xs text-zinc-500">
                  {records.length === 0
                    ? 'No resolved records in incidents collection yet. Click "Import CSV" to upload.'
                    : 'No records match your search or filter criteria.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pt-1 flex items-center justify-between text-xs text-zinc-400">
        <span>
          Page {safePage} of {pages} ({filteredRecords.length} records)
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            className="px-2 py-1 rounded border border-zinc-700 disabled:opacity-40 cursor-pointer"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={safePage >= pages}
            onClick={() => setPage(safePage + 1)}
            className="px-2 py-1 rounded border border-zinc-700 disabled:opacity-40 cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default IncidentsFiles