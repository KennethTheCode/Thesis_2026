export const CSV_HEADERS = [
  'source_record_id',
  'accident_date',
  'year',
  'month',
  'incident_type',
  'barangay',
  'latitude',
  'longitude',
  'landmark_reference',
  'status',
]

export const MONTH_OPTIONS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

export const YEAR_OPTIONS = ['2025', '2024', '2023', '2022']

export const INCIDENT_TYPE_OPTIONS = [
  'VEHICULAR',
  'MEDICAL ASSISTANCE',
  'WEATHER',
  'FIRE',
  'OTHERS',
  'ORGANIZED EVENT',
  'AMBULANCE TRANSPORT',
  'SHOOTING',
  'WATER BREAKDOWN',
  'DROWNING',
  'EARTHQUAKE',
  'FLOOD',
]

// Initial sample rows matching ResQ_Binan_Geospatial_Historical_Resolved.csv
export const INITIAL_CSV_ROWS = [
  {
    source_record_id: 'LEMS-2022-0001',
    accident_date: '2022-05-04 08:54',
    year: 2022,
    month: 5,
    incident_type: 'VEHICULAR',
    barangay: 'Langkiwa',
    latitude: 14.295957,
    longitude: 121.057463,
    landmark_reference: 'Langkiwa Barangay Road (near Langkiwa Elementary School)',
    status: 'resolved',
  },
  {
    source_record_id: 'LEMS-2022-0002',
    accident_date: '2022-06-14 08:42',
    year: 2022,
    month: 6,
    incident_type: 'OTHERS',
    barangay: 'Biñan (Poblacion)',
    latitude: 14.262601,
    longitude: 121.053299,
    landmark_reference: 'Cecilia Araneta Pkwy',
    status: 'resolved',
  },
  {
    source_record_id: 'LEMS-2022-0003',
    accident_date: '2022-06-14 09:35',
    year: 2022,
    month: 6,
    incident_type: 'VEHICULAR',
    barangay: 'Malaban',
    latitude: 14.348201,
    longitude: 121.089379,
    landmark_reference: 'Malaban lakeside center',
    status: 'resolved',
  },
  {
    source_record_id: 'LEMS-2022-0004',
    accident_date: '2022-06-14 11:37',
    year: 2022,
    month: 6,
    incident_type: 'WEATHER',
    barangay: 'Zapote',
    latitude: 14.320307,
    longitude: 121.082189,
    landmark_reference: 'Zapote / Alonte Sports Arena & PUP Biñan civic complex',
    status: 'resolved',
  },
  {
    source_record_id: 'LEMS-2022-0005',
    accident_date: '2022-06-14 11:55',
    year: 2022,
    month: 6,
    incident_type: 'FIRE',
    barangay: 'Ganado',
    latitude: 14.286388,
    longitude: 121.083155,
    landmark_reference: 'Ganado Barangay Road (approx. 670 m east of Optodev-Essilor)',
    status: 'resolved',
  },
]

function splitCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

export function parseHistoricalCsv(csvText) {
  const lines = String(csvText || '')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')

  if (lines.length < 2) {
    throw new Error('CSV file is empty or missing data rows.')
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim())
  const missingHeaders = CSV_HEADERS.filter((required) => !headers.includes(required))

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required CSV columns: ${missingHeaders.join(', ')}`)
  }

  return lines.slice(1).map((line, index) => {
    const values = splitCsvLine(line)
    const raw = {}
    headers.forEach((header, idx) => {
      raw[header] = values[idx] ?? ''
    })

    return {
      source_record_id: raw.source_record_id || `ROW-${index + 1}`,
      accident_date: raw.accident_date || '',
      year: Number(raw.year) || '',
      month: Number(raw.month) || '',
      incident_type: raw.incident_type || '',
      barangay: raw.barangay || '',
      latitude: raw.latitude !== '' ? parseFloat(raw.latitude) : '',
      longitude: raw.longitude !== '' ? parseFloat(raw.longitude) : '',
      landmark_reference: raw.landmark_reference || '',
      status: (raw.status || 'resolved').toLowerCase(),
    }
  })
}