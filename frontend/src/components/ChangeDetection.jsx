import { useState } from 'react'
import { fetchChangeDetection } from '../api'
import InteractiveMap from './InteractiveMap'

const CD_PRESETS = [
  { label: 'Barabil Open Pit Lease (Odisha)', box: { west: 85.35, south: 22.08, east: 85.45, north: 22.18 } },
  { label: 'Tirodi Mine Quarry (MP)',         box: { west: 79.70, south: 21.65, east: 79.78, north: 21.72 } },
  { label: 'Dongri Buzurg Pit (MH)',          box: { west: 79.68, south: 21.52, east: 79.76, north: 21.58 } },
  { label: 'Sandur Valley Quarry (KA)',       box: { west: 76.51, south: 15.05, east: 76.58, north: 15.12 } },
]

export default function ChangeDetection({ initialBbox, onStatusMessage }) {
  const [bbox, setBbox] = useState(
    initialBbox || { west: 85.35, south: 22.08, east: 85.45, north: 22.18 }
  )
  const [baselineDate, setBaselineDate] = useState('2023-11-01')
  const [monitoringDate, setMonitoringDate] = useState('2024-04-15')
  const [sensitivity, setSensitivity] = useState(0.5)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  function applyQuickDateRange(monthsAgo) {
    const now = new Date()
    const past = new Date()
    past.setMonth(now.getMonth() - monthsAgo)
    setMonitoringDate(now.toISOString().slice(0, 10))
    setBaselineDate(past.toISOString().slice(0, 10))
  }

  async function handleRunChangeDetection() {
    setError(null)
    setRunning(true)
    setResults(null)

    try {
      const data = await fetchChangeDetection({
        ...bbox,
        baselineDate,
        monitoringDate,
        sensitivity,
      })
      setResults(data)
      onStatusMessage?.(
        `Change detection complete: ${data.metrics?.total_disturbance_ha || 0} ha disturbance identified.`,
        'success'
      )
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Change detection failed.'
      setError(msg)
      onStatusMessage?.(msg, 'error')
    } finally {
      setRunning(false)
    }
  }

  function exportChangeCSV() {
    if (!results?.hotspots?.length) return
    const headers = ['Hotspot ID', 'Classification Type', 'Severity', 'Latitude', 'Longitude', 'Area (ha)', 'Confidence %', 'Description']
    const rows = results.hotspots.map(h => [
      h.id,
      `"${h.type}"`,
      h.severity,
      h.latitude,
      h.longitude,
      h.area_ha,
      h.confidence,
      `"${h.description}"`,
    ])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orevision-change-hotspots-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportChangeJSON() {
    if (!results) return
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orevision-change-detection-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Header Card ─────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <span>🔄 Multi-Date Surface Change Detection</span>
            </div>
            <div className="card-subtitle">
              Bi-temporal Sentinel-2 spectral differencing to monitor open-cast quarry advance, pit deepening, and environmental lease compliance.
            </div>
          </div>
          <span className="badge badge-violet">Active Sentinel Differencing</span>
        </div>
      </div>

      {/* ── Area & Date Selection Controls ───────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">🗺️ Monitoring Lease Area (AOI)</div>
          <div className="card-subtitle">Select an active mining block or drag custom bounding box</div>
        </div>

        <InteractiveMap bbox={bbox} onBBoxChange={setBbox} height={300} />

        <div style={{ marginTop: '0.75rem' }}>
          <div className="form-label" style={{ marginBottom: '0.4rem' }}>Mining Lease Presets:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {CD_PRESETS.map(p => (
              <button
                key={p.label}
                className="btn btn-secondary btn-sm"
                onClick={() => setBbox(p.box)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divider" />

        {/* Date Controls */}
        <div className="form-row" style={{ marginTop: '0.5rem' }}>
          <div className="form-group">
            <label className="form-label">Baseline Observation Date (T1)</label>
            <input
              type="date"
              value={baselineDate}
              onChange={e => setBaselineDate(e.target.value)}
              id="input-baseline-date"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Monitoring Observation Date (T2)</label>
            <input
              type="date"
              value={monitoringDate}
              min={baselineDate}
              onChange={e => setMonitoringDate(e.target.value)}
              id="input-monitoring-date"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => applyQuickDateRange(3)}>
            Last 3 Months
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => applyQuickDateRange(6)}>
            Last 6 Months
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => applyQuickDateRange(12)}>
            12 Months (Year-over-Year)
          </button>
        </div>

        {/* Sensitivity slider */}
        <div className="form-group" style={{ marginTop: '1rem', maxWidth: 420 }}>
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            Detection Sensitivity
            <span style={{ color: 'var(--color-permanganate)', fontFamily: 'var(--font-mono)' }}>
              {sensitivity >= 0.7 ? 'High' : sensitivity >= 0.4 ? 'Balanced' : 'Conservative'} ({sensitivity.toFixed(1)})
            </span>
          </label>
          <input
            type="range"
            min="0.2"
            max="0.8"
            step="0.1"
            value={sensitivity}
            onChange={e => setSensitivity(parseFloat(e.target.value))}
            style={{ accentColor: 'var(--color-permanganate)' }}
            id="input-sensitivity"
          />
        </div>

        <div style={{ marginTop: '1.25rem' }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleRunChangeDetection}
            disabled={running}
            id="btn-run-change-detection"
            style={{ minWidth: 260 }}
          >
            {running ? (
              <>
                <span className="spinner" />
                Computing Bi-Temporal Differencing...
              </>
            ) : (
              '🛰️ Execute Multi-Date Change Detection'
            )}
          </button>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────── */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">❌</span>
          <div>
            <strong>Change Detection Error:</strong> {error}
          </div>
        </div>
      )}

      {/* ── Results Dashboard ────────────────────────── */}
      {results && (
        <>
          {/* Executive Summary Metrics */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">📊 Surface Disturbance Metrics</div>
              <span className="badge badge-green">Temporal Diff Calculated</span>
            </div>

            <div className="metric-grid-4">
              <div className="metric-pill-card">
                <span className="label">Total Disturbance Area</span>
                <span className="val" style={{ color: 'var(--accent-red)' }}>
                  {results.metrics?.total_disturbance_ha} ha
                </span>
                <span className="sub">Across observation window</span>
              </div>
              <div className="metric-pill-card">
                <span className="label">Pit / Excavation Expansion</span>
                <span className="val" style={{ color: 'var(--accent-amber)' }}>
                  {results.metrics?.excavation_ha} ha
                </span>
                <span className="sub">High reflectance bare bench</span>
              </div>
              <div className="metric-pill-card">
                <span className="label">Vegetation Stripped</span>
                <span className="val">
                  {results.metrics?.vegetation_loss_ha} ha
                </span>
                <span className="sub">NDVI loss & road clearance</span>
              </div>
              <div className="metric-pill-card">
                <span className="label">Mean Spectral Shift</span>
                <span className="val" style={{ color: 'var(--accent-cyan)' }}>
                  Δ {results.metrics?.mean_spectral_delta}
                </span>
                <span className="sub">Euclidean band distance</span>
              </div>
            </div>

            {/* Executive Natural Language Summary */}
            <div className="alert alert-info" style={{ marginTop: '1rem' }}>
              <span className="alert-icon">📝</span>
              <div>
                <strong>Automated Observation Summary:</strong> {results.summary}
              </div>
            </div>
          </div>

          {/* 3-Panel Visual Comparison */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">🖼️ Bi-Temporal Image Comparison & Change Heatmap</div>
                <div className="card-subtitle">
                  Inspect Baseline (T1) vs Monitoring (T2) vs Classified Difference Heatmap
                </div>
              </div>
            </div>

            <div className="comparison-grid cols-3">
              {/* Baseline Image */}
              <div className="image-panel">
                <div className="image-panel-title">
                  <span>📅 Baseline (T1)</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{results.metrics?.baseline_date}</span>
                </div>
                <div className="image-panel-view">
                  <img
                    src={`data:image/png;base64,${results.baseline_image_base64}`}
                    alt="Baseline Satellite Observation"
                    id="img-baseline"
                  />
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Initial terrain state prior to monitoring cycle</span>
              </div>

              {/* Monitoring Image */}
              <div className="image-panel">
                <div className="image-panel-title">
                  <span>📅 Monitoring (T2)</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{results.metrics?.monitoring_date}</span>
                </div>
                <div className="image-panel-view">
                  <img
                    src={`data:image/png;base64,${results.monitoring_image_base64}`}
                    alt="Monitoring Satellite Observation"
                    id="img-monitoring"
                  />
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Updated satellite observation</span>
              </div>

              {/* Classified Change Heatmap */}
              <div className="image-panel" style={{ borderColor: 'var(--accent-red)' }}>
                <div className="image-panel-title">
                  <span style={{ color: 'var(--accent-red)' }}>🔥 Surface Disturbance Map</span>
                  <span className="badge badge-violet">Classified</span>
                </div>
                <div className="image-panel-view">
                  <img
                    src={`data:image/png;base64,${results.difference_heatmap_base64}`}
                    alt="Classified Surface Disturbance Heatmap"
                    id="img-difference-heatmap"
                  />
                </div>
                <div className="heatmap-legend-bar">
                  <span style={{ color: 'var(--text-muted)' }}>Stable</span>
                  <div className="diff-legend-ramp" />
                  <span style={{ color: 'var(--accent-red)' }}>Excavation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Disturbance Hotspots Table */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">📍 Detected Disturbance Hotspots</div>
                <div className="card-subtitle">
                  Pinpointed locations with significant spectral shift or land disturbance
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={exportChangeCSV} id="btn-export-change-csv">
                  📊 CSV
                </button>
                <button className="btn btn-secondary btn-sm" onClick={exportChangeJSON} id="btn-export-change-json">
                  📋 JSON
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {results.hotspots.map(hs => (
                <div
                  key={hs.id}
                  className={`hotspot-item ${hs.severity === 'High' ? 'severity-high' : 'severity-medium'}`}
                  id={`hotspot-${hs.id}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      <span>{hs.id}: {hs.type}</span>
                    </div>
                    <span className={`badge ${hs.severity === 'High' ? 'badge-amber' : 'badge-cyan'}`}>
                      {hs.severity} Severity · {hs.confidence}% Conf
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {hs.description}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>Coordinates: <strong>{hs.latitude}°N, {hs.longitude}°E</strong></span>
                    <span>Affected Area: <strong style={{ color: 'var(--accent-cyan)' }}>{hs.area_ha} ha</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Environmental Limitations & Disclaimers */}
          <div className="card">
            <div className="card-title" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              ⚠️ Environmental Disturbance Interpretation Disclaimers
            </div>
            <ul className="limitations-list">
              <li>Spectral changes indicate surface variations (albedo, moisture, vegetation canopy); field inspection is required to determine whether excavation is permitted within lease boundaries.</li>
              <li>Seasonal effects (monsoon greening, post-harvest agriculture) can induce natural NDVI variances which are filtered by multi-band differencing.</li>
            </ul>
          </div>
        </>
      )}

    </div>
  )
}
