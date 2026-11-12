import { useEffect, useState } from 'react'
import { SEARCH_DELAY_MS } from './Facilityoptions.js'

// Calls onSearch(text) once you stop typing for SEARCH_DELAY_MS (3000ms).
// onSearch must be a stable function (wrap it in useCallback in the parent).
function SearchFacilities({ onSearch }) {
  const [text, setText] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => onSearch(text.trim()), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)   // typing again restarts the wait
  }, [text, onSearch])

  return (
    <div className='bg-zinc-800 px-3 p-2 rounded-full w-[30%] text-sm text-zinc-500 flex items-center gap-2'>
      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>search</span>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={100}
        placeholder='Search Facilities...'
        className='bg-transparent outline-none w-full placeholder:text-zinc-500'
      />
    </div>
  )
}

export default SearchFacilities