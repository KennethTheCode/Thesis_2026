// All backend calls for facilities live here. Every function throws an Error with a
// readable message, so components only need try/catch.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function readError(data) {
  if (!data || !data.detail) return 'Something went wrong. Please try again.'
  if (typeof data.detail === 'string') return data.detail
  // FastAPI validation errors come as a list
  return data.detail.map((e) => `${e.loc?.[e.loc.length - 1] ?? 'field'}: ${e.msg}`).join('; ')
}

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${API_URL}/facilities${path}`, {
      credentials: 'include',
      ...options,
      // Only send this header when there is a body, otherwise every GET triggers a slow CORS preflight
      headers: options.body ? { 'Content-Type': 'application/json' } : {},
    })
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.')
  }

  let data = null
  try { data = await res.json() } catch { /* empty body */ }

  if (!res.ok) throw new Error(readError(data))
  return data
}

export const getFacilities = ({ status = 'active', search = '', page = 1 }) => {
  const params = new URLSearchParams({ status, search, page })
  return request(`?${params}`)
}

export const getMapFacilities = () => request('/map')

export const createFacility = (payload) =>
  request('', { method: 'POST', body: JSON.stringify(payload) })

export const updateFacility = (id, payload) =>
  request(`/${id}`, { method: 'PUT', body: JSON.stringify(payload) })

export const archiveFacility =(id) => request(`/${id}/archive`, { method: 'PATCH' })

export const restoreFacility = (id) => request(`/${id}/restore`, { method: 'PATCH' })