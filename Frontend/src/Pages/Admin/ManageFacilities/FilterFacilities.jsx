import React from 'react'

function FilterFacilities() {
  return (
    <div className='text-zinc-500 flex items-center gap-1 rounded  px-2 text-sm border border-zinc-800 bg-zinc-800'>
        <span class="material-symbols-outlined hover:text-zinc-400 duration-300 transition-colors cursor-pointer" style= {{ fontSize: '20px' }}>
         filter_list
        </span>
        Filter
    </div>
  )
}

export default FilterFacilities