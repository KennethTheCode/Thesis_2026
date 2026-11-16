// Shared facility settings. Keep FACILITY_TYPES values and BARANGAYS in sync with backend/db_schema.py.

export const FACILITY_TYPES = [
  { value: 'hospital',       label: 'Hospital',       color: '#dc2626', icon: 'local_hospital' },
  { value: 'fire_station',   label: 'Fire Station',   color: '#ea580c', icon: 'local_fire_department' },
  { value: 'police_station', label: 'Police Station', color: '#2563eb', icon: 'local_police' },
  { value: 'cdrrmo',         label: 'CDRRMO',         color: '#16a34a', icon: 'emergency' },
  { value: 'ambulance_base', label: 'Ambulance Base', color: '#9333ea', icon: 'medical_services' },
]

export const BARANGAYS = [
  'Biñan (Poblacion)', 'Bungahan', 'Canlalay', 'Casile', 'De La Paz', 'Ganado',
  'Langkiwa', 'Loma', 'Malaban', 'Malamig', 'Mampalasan', 'Platero', 'San Antonio',
  'San Francisco (Halang)', 'San Jose', 'San Vicente', 'Sto. Domingo', 'Sto. Niño',
  'Sto. Tomas (Calabuso)', 'Soro-soro', 'Timbao', 'Tubigan', 'Zapote',
]

// Must match the coordinate limits in backend/routers/facility.py
export const COORD_LIMITS = { minLat: 14.25, maxLat: 14.40, minLng: 121.02, maxLng: 121.14 }

export const SEARCH_DELAY_MS = 500    // search waits this long after you stop typing
export const SUBMIT_COOLDOWN_S = 3     // seconds the Add button is locked after submitting

export const typeInfo = (value) =>
  FACILITY_TYPES.find((t) => t.value === value) || { label: value, color: '#71717a', icon: 'location_on' }