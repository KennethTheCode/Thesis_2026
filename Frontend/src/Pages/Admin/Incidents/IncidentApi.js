// All backend calls for incidents live here.
// Errors are parsed cleanly into human-readable messages for try/catch blocks in components.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function readError(data) {
  if (!data || !data.detail) return 'Something went wrong. Please try again.';
  if (typeof data.detail === 'string') return data.detail;
  // FastAPI validation errors come as an array of error objects
  return data.detail.map((e) => `${e.loc?.[e.loc.length - 1] ?? 'field'}: ${e.msg}`).join('; ');
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}/incidents${path}`, {
      credentials: 'include',
      ...options,
      headers: options.body ? { 'Content-Type': 'application/json' } : {},
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

// Helper function: Resolves the WebSocket endpoint URL based on current protocol
export const getIncidentWSUrl = () => {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const baseUrl = API_URL.replace(/^https?:\/\//, '');
  return `${wsProtocol}//${baseUrl}/incidents/ws`;
};

export const checkActiveUserIncident = (userIdOrEmail) =>
  request(`/active/${userIdOrEmail}`);