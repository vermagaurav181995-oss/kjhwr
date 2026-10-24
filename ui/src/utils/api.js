const API_BASE = import.meta.env.VITE_API_URL || '';

export async function fetchApi(endpoint) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}