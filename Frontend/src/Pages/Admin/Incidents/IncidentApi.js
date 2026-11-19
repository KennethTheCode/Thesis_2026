// All backend calls for incidents and geospatial analytics live here.
// Errors are parsed cleanly into human-readable messages for try/catch blocks in components.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function readError(data) {
  if (!data || !data.detail) return 'Something went wrong. Please try again.';
  if (typeof data.detail === 'string') return data.detail;
  // FastAPI validation errors come as an array of error objects
  return data.detail
    .map((e) => `${e.loc?.[e.loc.length - 1] ?? 'field'}: ${e.msg}`)
    .join('; ');
}

async function request(path, options = {}, basePrefix = '/incidents') {
  const isFormData = options.body instanceof FormData;
  const headers =
    options.body && !isFormData
      ? { 'Content-Type': 'application/json', ...options.headers }
      : { ...options.headers };

  let res;
  try {
    res = await fetch(`${API_URL}${basePrefix}${path}`, {
      credentials: 'include',
      ...options,
      headers,
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty response body */
  }

  if (!res.ok) throw new Error(readError(data));
  return data;
}

// POST endpoint: Triggers an SOS request and saves incident + ticket to MongoDB
export const sendSOSIncident = (payload) =>
  request('', { method: 'POST', body: JSON.stringify(payload) });

// GET endpoint: Retrieves existing active incidents on initial map load
export const getMapIncidents = () => request('/map');

// PATCH endpoint: Updates incident lifecycle status (verified, dispatched, resolved, rejected)
export const updateIncidentStatus = (referenceNo, status) =>
  request(`/${encodeURIComponent(referenceNo)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

// GET endpoint: Checks if user already has an active incident
export const checkActiveUserIncident = (userIdOrEmail) =>
  request(`/active/${encodeURIComponent(userIdOrEmail)}`);

// POST endpoint: Imports historical LEMS CSV into the `incidents` collection
export const importIncidentsCsv = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return request('/import-csv', {
    method: 'POST',
    body: formData,
  });
};

// GET endpoint: Fetches all resolved records (CSV baseline + resolved live SOS) from `incidents`
export const getResolvedIncidents = () => request('/resolved');

// GET endpoint: Aggregates incident density per barangay from `/analytics/hotspots`
export const getIncidentHotspots = ({ year, month, incidentType, status = 'resolved' } = {}) => {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (year && year !== 'all') params.set('year', year);
  if (month && month !== 'all') params.set('month', month);
  if (incidentType && incidentType !== 'all') params.set('incident_type', incidentType);

  const qs = params.toString();
  return request(`/hotspots${qs ? `?${qs}` : ''}`, {}, '/analytics');
};

// Helper function: Resolves the WebSocket endpoint URL based on current protocol
export const getIncidentWSUrl = () => {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const baseUrl = API_URL.replace(/^https?:\/\//, '');
  return `${wsProtocol}//${baseUrl}/incidents/ws`;
};