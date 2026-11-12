import React, { useCallback, useEffect, useState } from 'react'
import SearchFacilities from '../ManageFacilities/SearchFacilities'
import FilterFacilities from './FilterFacilities'
import ArchiveFacilities from './ArchiveFacilities'
import AddFacilities from './AddFacilities'
import EditFacilities from './EditFacilities'
import { getFacilities, archiveFacility } from './Facilityapi.js'
import { typeInfo } from './Facilityoptions.js'

// refreshKey changes whenever data changed; onChanged() tells the parent to bump it
// (this is what updates the table AND the map without a page refresh).
function ViewFacilities({ refreshKey, onChanged }) {
  const [facilities, setFacilities] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)   // the facility being edited (null = popup closed)

  // New search always goes back to page 1
  const handleSearch = useCallback((text) => {
    setSearch(text)
    setPage(1)
  }, [])

  // Loads one page (max 5 rows) whenever the page, search, or refreshKey changes
  useEffect(() => {
    let ignore = false   // skip results from outdated requests

    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await getFacilities({ status: 'active', search, page })
        if (ignore) return
        if (data.items.length === 0 && page > 1) return setPage(page - 1)   // last row on page was archived
        setFacilities(data.items)
        setTotal(data.total)
        setPages(data.pages)
      } catch (err) {
        if (!ignore) setError(err.message)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    load()
    return () => { ignore = true }
  }, [page, search, refreshKey])

  const handleArchive = async (facility) => {
    if (!window.confirm(`Archive "${facility.name}"?`)) return
    try {
      await archiveFacility(facility.id)
      onChanged()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className='bg-zinc-900 flex flex-col border border-zinc-800 rounded gap-2'>

      {/* Header */}
      <div className='border-b-2 border-zinc-700 w-full p-3 flex items-center justify-between'>
        <div>
          <p className='font-semibold'>Active Facilities</p>
        </div>

        <div className='flex gap-2'>
          <AddFacilities onAdded={onChanged} />
          <ArchiveFacilities refreshKey={refreshKey} onChanged={onChanged} />
        </div>
      </div>

      {/* Search and Filter */}
      <div className='justify-between flex px-3 border-b border-zinc-800 pb-3 gap-2'>
        <SearchFacilities onSearch={handleSearch} />
        <FilterFacilities />
      </div>

      {error && (
        <p className="mx-2 text-red-400 text-xs border border-red-500/30 bg-red-500/10 rounded p-2">{error}</p>
      )}

      {/* Facilities Table */}
      <div className='mx-2 overflow-y-auto h-[40vh] overflow-x-auto rounded border border-zinc-800'>

        <table className='w-full text-sm text-left whitespace-nowrap'>

          <thead className='bg-zinc-800/70 text-zinc-400 text-xs uppercase'>
            <tr>
              <th className='px-3 py-3 font-semibold'>Facility Name</th>
              <th className='px-3 py-3 font-semibold'>Type</th>
              <th className='px-3 py-3 font-semibold'>Address</th>
              <th className='px-2 py-3 font-semibold'>Barangay</th>
              <th className='px-2 py-3 font-semibold'>Contact Number</th>
              <th className='px-3 py-3 font-semibold'>Coordinates (x, y)</th>
              <th className='px-3 py-3 font-semibold text-center'>Actions</th>
            </tr>
          </thead>

          <tbody className='divide-y divide-zinc-800'>

            {facilities.map((facility) => (
              <tr
                key={facility.id}
                className='hover:bg-zinc-800/40 transition-colors'
              >

                <td className='px-3 py-4 font-medium text-zinc-200'>
                  {facility.name}
                </td>

                <td className='px-3 py-4'>
                  <span className='px-1 py-1 rounded bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20'>
                    {typeInfo(facility.facility_type).label}
                  </span>
                </td>

                <td className='px-3 py-4 text-zinc-400 max-w-[250px] truncate'>
                  {facility.address}
                </td>

                <td className='px-2 py-4 text-zinc-300'>
                  {facility.barangay}
                </td>

                <td className='px-2 py-4 text-zinc-400'>
                  {facility.contact_number}
                </td>

                <td className='px-3 py-4 text-zinc-400 font-mono text-xs'>
                  {facility.longitude.toFixed(5)}, {facility.latitude.toFixed(5)}
                </td>

                <td className='px-3 py-4'>
                  <div className='flex items-center justify-center gap-2'>

                    <button onClick={() => setEditing(facility)} className='px-2 py-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-xs border border-blue-500/20 cursor-pointer'>
                      Edit
                    </button>

                    <button onClick={() => handleArchive(facility)} className='px-2 py-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs border border-red-500/20 cursor-pointer'>
                      Archive
                    </button>

                  </div>
                </td>

              </tr>
            ))}

            {loading && (
              <tr>
                <td colSpan="7" className='text-center py-10 text-zinc-500'>
                  Loading...
                </td>
              </tr>
            )}

            {!loading && facilities.length === 0 && (
              <tr>
                <td colSpan="7" className='text-center py-10 text-zinc-500'>
                  No facilities found.
                </td>
              </tr>
            )}

          </tbody>

        </table>
      </div>

      {/* Pagination (5 per page) */}
      <div className='mx-2 mb-4 flex items-center justify-between text-xs text-zinc-400'>
        <span>Page {page} of {pages}</span>
        <div className='flex gap-2'>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className='px-2 py-1 rounded border border-zinc-700 disabled:opacity-40 cursor-pointer'>Prev</button>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className='px-2 py-1 rounded border border-zinc-700 disabled:opacity-40 cursor-pointer'>Next</button>
        </div>
      </div>

      {/* Edit popup */}
      {editing && (
        <EditFacilities
          key={editing.id}
          facility={editing}
          onClose={() => setEditing(null)}
          onSaved={onChanged}
        />
      )}

    </div>
  )
}

export default ViewFacilities