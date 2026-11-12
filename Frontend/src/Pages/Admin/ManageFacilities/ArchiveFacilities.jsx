import { useEffect, useState } from 'react'
import { getFacilities, restoreFacility } from './Facilityapi.js'
import { typeInfo } from './Facilityoptions.js'

// Button + popup list of archived facilities (5 per page) with a Restore button.
// refreshKey changes whenever something was added/archived so the list stays current.
function ArchiveFacilities({ refreshKey, onChanged }) {
  const [showModal, setShowModal] = useState(false)
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!showModal) return
    let ignore = false   // skip results from outdated requests

    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await getFacilities({ status: 'archived', page })
        if (ignore) return
        if (data.items.length === 0 && page > 1) return setPage(page - 1)   // last item on page was restored
        setItems(data.items)
        setPages(data.pages)
        setTotal(data.total)
      } catch (err) {
        if (!ignore) setError(err.message)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    load()
    return () => { ignore = true }
  }, [showModal, page, refreshKey])

  const handleRestore = async (id) => {
    try {
      await restoreFacility(id)
      onChanged?.()   // refreshes the main list, map, and this list
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div onClick={() => { setPage(1); setShowModal(true) }} className='bg-yellow-600 text-white p-1 rounded text-sm font-semibold items-center flex gap-1 justify-center cursor-pointer hover:bg-yellow-600/20 hover:text-yellow-600 transition-colors duration-300'>
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>archive</span>Archived Facilities
      </div>

      {showModal && (
        <div className="bg-black/60 fixed inset-0 z-[100] flex justify-center items-center">
          <div className="bg-zinc-900 rounded w-[90vw] max-w-3xl flex flex-col border border-zinc-700">
            <div className="w-full p-3 border-b border-yellow-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: '23px' }}>archive</span>
                <p className="text-lg font-semibold">Archived Facilities: {total}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white cursor-pointer duration-300 transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>

            <div className='p-3 flex flex-col gap-2'>
              {error && <p className="text-red-400 text-xs border border-red-500/30 bg-red-500/10 rounded p-2">{error}</p>}

              <div className='overflow-x-auto rounded border border-zinc-800'>
                <table className='w-full text-sm text-left whitespace-nowrap'>
                  <thead className='bg-zinc-800/70 text-zinc-400 text-xs uppercase'>
                    <tr>
                      <th className='px-3 py-3 font-semibold'>Facility Name</th>
                      <th className='px-3 py-3 font-semibold'>Type</th>
                      <th className='px-3 py-3 font-semibold'>Barangay</th>
                      <th className='px-3 py-3 font-semibold text-center'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-zinc-800'>
                    {items.map((f) => (
                      <tr key={f.id} className='hover:bg-zinc-800/40 transition-colors'>
                        <td className='px-3 py-4 font-medium text-zinc-200'>{f.name}</td>
                        <td className='px-3 py-4'>
                          <span className='px-1 py-1 rounded bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20'>
                            {typeInfo(f.facility_type).label}
                          </span>
                        </td>
                        <td className='px-3 py-4 text-zinc-300'>{f.barangay}</td>
                        <td className='px-3 py-4 text-center'>
                          <button onClick={() => handleRestore(f.id)} className='px-2 py-1.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-xs border border-green-500/20 cursor-pointer'>
                            Restore
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!loading && items.length === 0 && (
                      <tr><td colSpan="4" className='text-center py-10 text-zinc-500'>No archived facilities.</td></tr>
                    )}
                    {loading && (
                      <tr><td colSpan="4" className='text-center py-10 text-zinc-500'>Loading...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className='flex items-center justify-between text-xs text-zinc-400'>
                <span>Page {page} of {pages}</span>
                <div className='flex gap-2'>
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)} className='px-2 py-1 rounded border border-zinc-700 disabled:opacity-40 cursor-pointer'>Prev</button>
                  <button disabled={page >= pages} onClick={() => setPage(page + 1)} className='px-2 py-1 rounded border border-zinc-700 disabled:opacity-40 cursor-pointer'>Next</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ArchiveFacilities