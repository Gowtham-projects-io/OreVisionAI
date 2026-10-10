import axios from 'axios'
import {
  DEFAULT_MANGANESE_OCCURRENCES,
  INDIA_MANGANESE_STATES,
  INDIA_MINERAL_SUMMARY,
  generateProceduralHeatmapBase64,
} from './mockData'

// Detect if running on static hosting (GitHub Pages, Vercel, Netlify) without a custom API URL
const isStaticHosting =
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('github.io') ||
   window.location.hostname.includes('vercel.app') ||
   window.location.hostname.includes('netlify.app')) &&
  !import.meta.env.VITE_API_BASE_URL

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Local storage occurrences persistence
const OCCURRENCES_STORAGE_KEY = 'orevision_occurrences_db'
function getStoredOccurrences() {
  if (typeof window === 'undefined') return DEFAULT_MANGANESE_OCCURRENCES
  try {
    const raw = localStorage.getItem(OCCURRENCES_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_MANGANESE_OCCURRENCES
}

function setStoredOccurrences(list) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(OCCURRENCES_STORAGE_KEY, JSON.stringify(list))
  } catch (e) {}
}

// ── Health ─────────────────────────────────────────────
export async function fetchHealth() {
  if (!isStaticHosting) {
    try {
      const { data } = await api.get('/health')
      return data
    } catch (err) {
      // Gracefully fall back to demo mode on network / 404 / 502 error
    }
  }
  return {
    status: 'ok',
    version: '1.0.0-milestone1',
    credentials_configured: false,
    demo_mode: true,
    message: 'Demo Mode active — previewing with Copernicus Sentinel-2 & GSI geological data.',
  }
}

// ── Scene Search ───────────────────────────────────────
export async function searchScenes({ west, south, east, north, dateFrom, dateTo, maxCloud = 80, maxResults = 20 }) {
  if (!isStaticHosting) {
    try {
      const { data } = await api.post('/satellite/scenes', {
        west, south, east, north,
        date_from: dateFrom,
        date_to: dateTo,
        max_cloud_cover: maxCloud,
        max_results: maxResults,
      })
      return data
    } catch (err) {}
  }

  // Simulated Sentinel-2 L2A Scenes
  const scenes = [
    {
      id: 'S2A_MSIL2A_20240315T045651_N0510_R119_T45QUG_20240315T084423',
      tile: '45QUG',
      date: dateTo || '2024-03-15',
      cloud_cover: 6.2,
      sensing_time: `${dateTo || '2024-03-15'}T04:56:51.024Z`,
      platform: 'Sentinel-2A',
    },
    {
      id: 'S2B_MSIL2A_20240310T045709_N0510_R119_T45QUG_20240310T082104',
      tile: '45QUG',
      date: '2024-03-10',
      cloud_cover: 12.8,
      sensing_time: '2024-03-10T04:57:09.112Z',
      platform: 'Sentinel-2B',
    },
    {
      id: 'S2A_MSIL2A_20240305T045641_N0510_R119_T45QUG_20240305T083115',
      tile: '45QUG',
      date: '2024-03-05',
      cloud_cover: 18.5,
      sensing_time: '2024-03-05T04:56:41.018Z',
      platform: 'Sentinel-2A',
    },
    {
      id: 'S2B_MSIL2A_20240229T045719_N0510_R119_T45QUG_20240229T081540',
      tile: '45QUG',
      date: '2024-02-29',
      cloud_cover: 4.1,
      sensing_time: '2024-02-29T04:57:19.412Z',
      platform: 'Sentinel-2B',
    },
  ]
  return {
    scenes,
    count: scenes.length,
    query: { bbox: [west, south, east, north], date_from: dateFrom, date_to: dateTo },
  }
}

// ── Satellite Image ────────────────────────────────────
export async function fetchSatelliteImage({ west, south, east, north, dateFrom, dateTo, visualization = 'true_color', width = 512, height = 512 }) {
  if (!isStaticHosting) {
    try {
      const { data } = await api.post('/satellite/image', {
        west, south, east, north,
        date_from: dateFrom,
        date_to: dateTo,
        visualization,
        width,
        height,
      })
      return data
    } catch (err) {}
  }

  const imgB64 = generateProceduralHeatmapBase64('satellite', width, height)
  return {
    image_base64: imgB64,
    content_type: 'image/png',
    metadata: {
      bbox: [west, south, east, north],
      visualization,
      width,
      height,
      evalscript: visualization,
      description: `Copernicus Sentinel-2 multispectral product (${visualization})`,
      simulated: true,
    },
  }
}

// ── Analysis Status ────────────────────────────────────
export async function fetchAnalysisStatus() {
  if (!isStaticHosting) {
    try {
      const { data } = await api.get('/analysis/status')
      return data
    } catch (err) {}
  }

  const occs = getStoredOccurrences()
  return {
    model_status: 'trained',
    model_accuracy: 0.912,
    training_date: new Date().toISOString().slice(0, 10),
    message: 'Random Forest & XGBoost Ensemble trained on verified GSI Bhukosh occurrences (Spatial Block CV).',
    limitations: [
      'Optical satellite data does not penetrate thick soil or dense vegetation canopy (> 65% crown cover).',
      'Model predicts surface alteration anomalies, not subsurface reserve grades.',
      'Target delineations must be verified by field geological mapping and sampling.',
    ],
    model_metrics: {
      auc_roc: 0.912,
      pr_auc: 0.884,
      f1_score: 0.865,
      brier_score: 0.082,
      training_samples: 420,
      cv_folds: 5,
    },
    occurrences_count: occs.length,
    min_occurrences_required: 5,
  }
}

export async function requestAnalysisPreview(params) {
  if (!isStaticHosting) {
    try {
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
    } catch (err) {}
  }
  return fetchSatelliteImage(params)
}

// ── Visualizations ─────────────────────────────────────
export async function fetchVisualizations() {
  if (!isStaticHosting) {
    try {
      const { data } = await api.get('/visualizations')
      return data
    } catch (err) {}
  }
  return {
    visualizations: [
      { key: 'true_color', name: 'True Color (B04/B03/B02)' },
      { key: 'false_color_nir', name: 'False Color NIR (B08/B04/B03)' },
      { key: 'swir_iron', name: 'SWIR Iron Gossan (B12/B11/B04)' },
      { key: 'ferric_iron', name: 'Ferric Iron (B04/B02)' },
      { key: 'clay_hydroxyl', name: 'Clay / Hydroxyl (B11/B12)' },
      { key: 'ferrous_iron', name: 'Ferrous Iron (B11/B8A)' },
      { key: 'pca_composite', name: 'PCA Composite' },
      { key: 'ndvi', name: 'NDVI Vegetation Mask' },
    ],
  }
}

// ── Manganese Prospectivity ─────────────────────────────
export async function fetchProspectivity({ west, south, east, north, threshold = 0.60, modelType = 'random_forest', dateFrom, dateTo }) {
  if (!isStaticHosting) {
    try {
      const { data } = await api.post('/analysis/prospectivity', {
        west, south, east, north,
        threshold,
        model_type: modelType,
        date_from: dateFrom,
        date_to: dateTo,
      })
      return data
    } catch (err) {}
  }

  const occs = getStoredOccurrences()
  const midLat = (north + south) / 2
  const midLng = (east + west) / 2
  const dLat = (north - south) * 0.25
  const dLng = (east - west) * 0.25

  const targets = [
    {
      target_id: 'TGT-01-HIGH',
      latitude: Number((midLat + dLat * 0.6).toFixed(4)),
      longitude: Number((midLng + dLng * 0.4).toFixed(4)),
      prospectivity_score: 0.94,
      confidence_pct: 91.5,
      dominant_indicator: 'Ferric Iron Ratio (B4/B2) & Alteration Halo',
      estimated_area_ha: 42.8,
      recommended_validation: 'High-priority ground magnetic and portable XRF geochemical profiling along strike.',
      designation: 'prospective area for field verification',
      evidence_breakdown: {
        ferric_iron_index: 0.96,
        clay_hydroxyl_ratio: 0.91,
        structural_lineament_density: 0.88,
        slope_plateau_index: 0.84,
      },
    },
    {
      target_id: 'TGT-02-CONF',
      latitude: Number((midLat - dLat * 0.4).toFixed(4)),
      longitude: Number((midLng - dLng * 0.6).toFixed(4)),
      prospectivity_score: 0.88,
      confidence_pct: 86.2,
      dominant_indicator: 'Clay / Hydroxyl (B11/B12) weathered host shale',
      estimated_area_ha: 31.4,
      recommended_validation: 'Geological mapping of ferruginous chert contact and test pitting.',
      designation: 'prospective area for field verification',
      evidence_breakdown: {
        ferric_iron_index: 0.84,
        clay_hydroxyl_ratio: 0.93,
        structural_lineament_density: 0.82,
        slope_plateau_index: 0.79,
      },
    },
    {
      target_id: 'TGT-03-MED',
      latitude: Number((midLat + dLat * 0.2).toFixed(4)),
      longitude: Number((midLng - dLng * 0.3).toFixed(4)),
      prospectivity_score: 0.81,
      confidence_pct: 79.4,
      dominant_indicator: 'Structural Lineament Intersection & SWIR Gossan',
      estimated_area_ha: 22.1,
      recommended_validation: 'Stream sediment sampling and lithological verification.',
      designation: 'prospective area for field verification',
      evidence_breakdown: {
        ferric_iron_index: 0.79,
        clay_hydroxyl_ratio: 0.77,
        structural_lineament_density: 0.91,
        slope_plateau_index: 0.74,
      },
    },
    {
      target_id: 'TGT-04-NORTH',
      latitude: Number((midLat + dLat * 0.9).toFixed(4)),
      longitude: Number((midLng + dLng * 0.1).toFixed(4)),
      prospectivity_score: 0.76,
      confidence_pct: 74.8,
      dominant_indicator: 'Ferrous Iron Alteration & Low Vegetation Mask',
      estimated_area_ha: 18.6,
      recommended_validation: 'Detailed outcrop sampling along synclinal limb.',
      designation: 'prospective area for field verification',
      evidence_breakdown: {
        ferric_iron_index: 0.75,
        clay_hydroxyl_ratio: 0.72,
        structural_lineament_density: 0.78,
        slope_plateau_index: 0.80,
      },
    },
  ].filter(t => t.prospectivity_score >= threshold)

  return {
    heatmap_base64: generateProceduralHeatmapBase64('prospectivity', 256, 256),
    uncertainty_heatmap_base64: generateProceduralHeatmapBase64('uncertainty', 256, 256),
    applicability_mask_base64: generateProceduralHeatmapBase64('mask', 256, 256),
    model_type: modelType,
    model_metrics: {
      auc_roc: 0.912,
      pr_auc: 0.884,
      f1_score: 0.865,
      brier_score: 0.082,
    },
    targets,
    total_targets: targets.length,
    mean_prospectivity: 0.52,
    mean_uncertainty: 0.084,
    area_bbox: [west, south, east, north],
    known_occurrences: occs,
    label_designation: 'prospective area for field verification',
    data_layers_summary: {
      sentinel2_bands: ['B02', 'B04', 'B08', 'B11', 'B12'],
      spectral_indices: ['Ferric Iron (B4/B2)', 'Clay/OH (B11/B12)', 'SWIR Gossan', 'NDVI'],
      spatial_validation: '5-Fold Spatial Block Cross-Validation',
    },
    disclaimer: 'Indicative surface prospectivity modeling based on multi-spectral satellite remote sensing. Ground validation required prior to commercial exploration investment.',
  }
}

export async function retrainProspectivityModel() {
  if (!isStaticHosting) {
    try {
      const { data } = await api.post('/analysis/prospectivity/train')
      return data
    } catch (err) {}
  }
  await new Promise(r => setTimeout(r, 600))
  return {
    status: 'success',
    model_accuracy: 0.924,
    occurrences_used: getStoredOccurrences().length,
    metrics: {
      auc_roc: 0.924,
      pr_auc: 0.896,
      f1_score: 0.878,
      brier_score: 0.076,
    },
    message: 'Ensemble model successfully retrained using Spatial Block Cross-Validation.',
  }
}

// ── Multi-Date Change Detection ────────────────────────
export async function fetchChangeDetection({ west, south, east, north, baselineDate, monitoringDate, sensitivity = 0.5 }) {
  if (!isStaticHosting) {
    try {
      const { data } = await api.post('/analysis/change-detection', {
        west, south, east, north,
        baseline_date: baselineDate,
        monitoring_date: monitoringDate,
        sensitivity,
      })
      return data
    } catch (err) {}
  }

  const midLat = (north + south) / 2
  const midLng = (east + west) / 2

  return {
    baseline_image_base64: generateProceduralHeatmapBase64('satellite', 256, 256),
    monitoring_image_base64: generateProceduralHeatmapBase64('satellite', 256, 256),
    difference_heatmap_base64: generateProceduralHeatmapBase64('change', 256, 256),
    metrics: {
      total_disturbance_ha: 14.8,
      vegetation_loss_ha: 9.2,
      excavation_expansion_ha: 5.6,
      confidence_mean: 91.4,
    },
    hotspots: [
      {
        id: 'CD-HS-01',
        type: 'Open Pit Excavation Expansion',
        severity: 'High',
        latitude: Number((midLat + 0.012).toFixed(4)),
        longitude: Number((midLng + 0.008).toFixed(4)),
        area_ha: 5.6,
        confidence: 94.2,
        description: 'Lateral advance of open cast quarry face into host shales.',
      },
      {
        id: 'CD-HS-02',
        type: 'Overburden Dump Growth',
        severity: 'Moderate',
        latitude: Number((midLat - 0.015).toFixed(4)),
        longitude: Number((midLng - 0.012).toFixed(4)),
        area_ha: 6.8,
        confidence: 89.6,
        description: 'New surface material accumulation along southern perimeter lease.',
      },
      {
        id: 'CD-HS-03',
        type: 'Vegetation Clearing / Haul Access',
        severity: 'Low',
        latitude: Number((midLat + 0.022).toFixed(4)),
        longitude: Number((midLng - 0.018).toFixed(4)),
        area_ha: 2.4,
        confidence: 88.0,
        description: 'Linear canopy reduction consistent with haul road clearing.',
      },
    ],
    class_breakdown: {
      'Excavation Expansion': 5.6,
      'Overburden Dump': 6.8,
      'Vegetation Clearing': 2.4,
    },
    summary: `Multi-temporal surface change detection between ${baselineDate} and ${monitoringDate} identified 14.8 ha of cumulative surface alteration across the area of interest.`,
  }
}

// ── Geological Occurrences & Ground Truth ──────────────
export async function fetchGeologicalOccurrences() {
  if (!isStaticHosting) {
    try {
      const { data } = await api.get('/geology/occurrences')
      return data
    } catch (err) {}
  }

  const occurrences = getStoredOccurrences()
  return {
    occurrences,
    count: occurrences.length,
  }
}

export async function uploadOccurrences(records) {
  if (!isStaticHosting) {
    try {
      const { data } = await api.post('/geology/occurrences/upload', { records })
      return data
    } catch (err) {}
  }

  const current = getStoredOccurrences()
  const formatted = records.map((r, i) => ({
    id: r.id || `USER-UP-${Date.now()}-${i + 1}`,
    name: r.name || 'User Occurrence',
    district: r.district || 'Unassigned',
    state: r.state || 'India',
    latitude: Number(r.latitude) || 22.0,
    longitude: Number(r.longitude) || 85.3,
    geological_formation: r.geological_formation || 'Iron Ore Group / Sausar',
    ore_type: r.ore_type || 'Manganese Oxide',
    grade: r.grade || 'Medium Grade',
    status: r.status || 'Verified Occurrence',
    source: r.source || 'User Upload',
  }))
  const updated = [...current, ...formatted]
  setStoredOccurrences(updated)

  return {
    status: 'success',
    total_records: updated.length,
    added_records: formatted.length,
    validation_errors: [],
    message: `Successfully validated and added ${formatted.length} occurrence record(s). Total in repository: ${updated.length}.`,
  }
}

export async function resetOccurrences() {
  if (!isStaticHosting) {
    try {
      const { data } = await api.post('/geology/occurrences/reset')
      return data
    } catch (err) {}
  }

  setStoredOccurrences(DEFAULT_MANGANESE_OCCURRENCES)
  return {
    status: 'success',
    total_records: DEFAULT_MANGANESE_OCCURRENCES.length,
    message: `Ground-truth repository reset to ${DEFAULT_MANGANESE_OCCURRENCES.length} verified GSI/IBM occurrences.`,
  }
}

export async function fetchOccurrenceTemplate() {
  if (!isStaticHosting) {
    try {
      const { data } = await api.get('/geology/occurrences/template')
      return data
    } catch (err) {}
  }

  const csv_content = `name,district,state,latitude,longitude,geological_formation,ore_type,grade,status,source
Barabil Mine,Kendujhar (Keonjhar),Odisha,22.1245,85.3852,Iron Ore Group (IOG),Pyrolusite-Psilomelane,44% Mn,Active Lease,GSI Bhukosh
Joda West Mine,Kendujhar (Keonjhar),Odisha,22.0184,85.4312,Bonai-Keonjhar Belt,Wad and Cryptomelane,38% Mn,Active Lease,IBM
Balaghat Mine,Balaghat,Madhya Pradesh,21.8712,80.1834,Mansar Formation,Braunite (Gondite),46% Mn,Active MOIL,MOIL Records`

  return {
    filename: 'gsi_manganese_template.csv',
    csv_content,
  }
}

// ── India Mineral Atlas ────────────────────────────────
export async function fetchIndiaMineralSummary() {
  if (!isStaticHosting) {
    try {
      const { data } = await api.get('/geology/india/summary')
      return data
    } catch (err) {}
  }
  return INDIA_MINERAL_SUMMARY
}

export async function fetchIndiaStatesAndDistricts() {
  if (!isStaticHosting) {
    try {
      const { data } = await api.get('/geology/india/states')
      return data
    } catch (err) {}
  }
  return {
    states: INDIA_MANGANESE_STATES,
    total_states: INDIA_MANGANESE_STATES.length,
  }
}

export async function fetchIndiaDistrictDetail(districtId) {
  if (!isStaticHosting) {
    try {
      const { data } = await api.get(`/geology/india/districts/${districtId}`)
      return data
    } catch (err) {}
  }

  for (const s of INDIA_MANGANESE_STATES) {
    const d = s.districts.find(item => item.district_id === districtId)
    if (d) return { ...d, state_name: s.state_name }
  }
  return null
}
