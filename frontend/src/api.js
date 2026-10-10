import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 90000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Health ─────────────────────────────────────────────
export async function fetchHealth() {
  const { data } = await api.get('/health')
  return data
}

// ── Scene Search ───────────────────────────────────────
export async function searchScenes({ west, south, east, north, dateFrom, dateTo, maxCloud = 80, maxResults = 20 }) {
  const { data } = await api.post('/satellite/scenes', {
    west, south, east, north,
    date_from: dateFrom,
    date_to: dateTo,
    max_cloud_cover: maxCloud,
    max_results: maxResults,
  })
  return data
}

// ── Satellite Image ────────────────────────────────────
export async function fetchSatelliteImage({ west, south, east, north, dateFrom, dateTo, visualization = 'true_color', width = 512, height = 512 }) {
  const { data } = await api.post('/satellite/image', {
    west, south, east, north,
    date_from: dateFrom,
    date_to: dateTo,
    visualization,
    width,
    height,
  })
  return data
}

// ── Analysis ───────────────────────────────────────────
export async function fetchAnalysisStatus() {
  const { data } = await api.get('/analysis/status')
  return data
}

export async function requestAnalysisPreview(params) {
  const { data } = await api.post('/analysis/preview', {
    west: params.west,
    south: params.south,
    east: params.east,
    north: params.north,
    date_from: params.dateFrom,
    date_to: params.dateTo,
    visualization: params.visualization || 'true_color',
    width: 512,
    height: 512,
  })
  return data
}

// ── Visualizations ─────────────────────────────────────
export async function fetchVisualizations() {
  const { data } = await api.get('/visualizations')
  return data
}

// ── Manganese Prospectivity ─────────────────────────────
export async function fetchProspectivity({ west, south, east, north, threshold = 0.60, modelType = 'random_forest', dateFrom, dateTo }) {
  const { data } = await api.post('/analysis/prospectivity', {
    west, south, east, north,
    threshold,
    model_type: modelType,
    date_from: dateFrom,
    date_to: dateTo,
  })
  return data
}

export async function retrainProspectivityModel() {
  const { data } = await api.post('/analysis/prospectivity/train')
  return data
}

// ── Multi-Date Change Detection ────────────────────────
export async function fetchChangeDetection({ west, south, east, north, baselineDate, monitoringDate, sensitivity = 0.5 }) {
  const { data } = await api.post('/analysis/change-detection', {
    west, south, east, north,
    baseline_date: baselineDate,
    monitoring_date: monitoringDate,
    sensitivity,
  })
  return data
}

// ── Geological Occurrences & Ground Truth ──────────────
export async function fetchGeologicalOccurrences() {
  const { data } = await api.get('/geology/occurrences')
  return data
}

export async function uploadOccurrences(records) {
  const { data } = await api.post('/geology/occurrences/upload', { records })
  return data
}

export async function resetOccurrences() {
  const { data } = await api.post('/geology/occurrences/reset')
  return data
}

export async function fetchOccurrenceTemplate() {
  const { data } = await api.get('/geology/occurrences/template')
  return data
}

// ── India Mineral Atlas ────────────────────────────────
export async function fetchIndiaMineralSummary() {
  const { data } = await api.get('/geology/india/summary')
  return data
}

export async function fetchIndiaStatesAndDistricts() {
  const { data } = await api.get('/geology/india/states')
  return data
}

export async function fetchIndiaDistrictDetail(districtId) {
  const { data } = await api.get(`/geology/india/districts/${districtId}`)
  return data
}


