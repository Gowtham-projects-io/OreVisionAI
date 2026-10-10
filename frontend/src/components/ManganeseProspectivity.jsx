import { useState, useEffect } from 'react'
import {
  fetchAnalysisStatus,
  fetchProspectivity,
  retrainProspectivityModel,
  fetchGeologicalOccurrences,
  uploadOccurrences,
  resetOccurrences,
  fetchOccurrenceTemplate,
} from '../api'
import InteractiveMap from './InteractiveMap'

const PILOT_BBOX = { west: 85.05, south: 21.75, east: 85.65, north: 22.35 }

export default function ManganeseProspectivity({ initialBbox, onStatusMessage }) {
  const [bbox, setBbox] = useState(initialBbox || PILOT_BBOX)
  const [threshold, setThreshold] = useState(0.55)
  const [modelType, setModelType] = useState('random_forest') // 'random_forest' | 'xgboost' | 'ensemble'

  // Model & Repository Status
  const [status, setStatus] = useState(null)
  const [occurrences, setOccurrences] = useState([])
  const [_loadingStatus, setLoadingStatus] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [training, setTraining] = useState(false)
  const [results, setResults] = useState(null)
  const [selectedTarget, setSelectedTarget] = useState(null)
  const [error, setError] = useState(null)

  // Layer Visibility Controls
  const [showProspectivityLayer, setShowProspectivityLayer] = useState(true)
  const [showUncertaintyLayer, setShowUncertaintyLayer] = useState(false)
  const [showMaskLayer, setShowMaskLayer] = useState(false)
  const [showOccurrencesLayer, setShowOccurrencesLayer] = useState(true)

  // Upload Modal / State
  const [uploadText, setUploadText] = useState('')
  const [uploadStatus, setUploadStatus] = useState(null)
  const [uploadErrors, setUploadErrors] = useState([])
  const [showUploader, setShowUploader] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoadingStatus(true)
    try {
      const [statusData, occData] = await Promise.all([
        fetchAnalysisStatus().catch(() => null),
        fetchGeologicalOccurrences().catch(() => ({ occurrences: [] })),
      ])
      setStatus(statusData)
      setOccurrences(occData?.occurrences || [])
    } finally {
      setLoadingStatus(false)
    }
  }

  async function handleRunProspectivity() {
    setError(null)
    setAnalyzing(true)
    setResults(null)
    setSelectedTarget(null)

    try {
      const data = await fetchProspectivity({
        ...bbox,
        threshold,
        modelType,
      })
      setResults(data)
      setShowProspectivityLayer(true)
      onStatusMessage?.(
        `Prospectivity analysis complete: ${data.total_targets} prospective area(s) delineated for field verification.`,
        'success'
      )
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Prospectivity analysis failed.'
      setError(msg)
      onStatusMessage?.(msg, 'error')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleRetrain() {
    setTraining(true)
    try {
      const resp = await retrainProspectivityModel()
      onStatusMessage?.(resp.message || 'Model retrained with Spatial Block CV!', 'success')
      await loadData()
    } catch (err) {
      onStatusMessage?.('Model training failed: ' + err.message, 'error')
    } finally {
      setTraining(false)
    }
  }

  async function handleDownloadTemplate() {
    try {
      const res = await fetchOccurrenceTemplate()
      const blob = new Blob([res.csv_content], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.filename || 'gsi_manganese_template.csv'
      a.click()
      URL.revokeObjectURL(url)
      onStatusMessage?.('Sample GSI Bhukosh occurrence CSV downloaded.', 'info')
    } catch (err) {
      onStatusMessage?.('Failed to download template: ' + err.message, 'error')
    }
  }

  async function handleUploadOccurrences() {
    setUploadStatus(null)
    setUploadErrors([])

    if (!uploadText.trim()) {
      onStatusMessage?.('Please paste CSV or GeoJSON text first.', 'error')
      return
    }

    try {
      let records = []
      const trimmed = uploadText.trim()

      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        // Parse JSON / GeoJSON
        const parsed = JSON.parse(trimmed)
        if (parsed.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
          records = parsed.features.map(f => ({
            name: f.properties?.name || f.properties?.deposit_name || 'Uploaded Feature',
            latitude: f.geometry?.coordinates?.[1],
            longitude: f.geometry?.coordinates?.[0],
            geological_formation: f.properties?.geological_formation || f.properties?.formation,
            ore_type: f.properties?.ore_type || f.properties?.mineral,
            grade: f.properties?.grade,
            status: f.properties?.status,
            district: f.properties?.district,
            state: f.properties?.state,
          }))
        } else if (Array.isArray(parsed)) {
          records = parsed
        }
      } else {
        // Parse CSV
        const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean)
        if (lines.length < 2) {
          throw new Error('CSV must have a header row and at least one data row.')
        }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        records = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim())
          const row = {}
          headers.forEach((h, idx) => {
            row[h] = vals[idx]
          })
          return row
        })
      }

      const res = await uploadOccurrences(records)
      setUploadStatus(res.message)
      setUploadErrors(res.validation_errors || [])

      if (res.status === 'success') {
        onStatusMessage?.(res.message, 'success')
        setUploadText('')
        await loadData()
      } else {
        onStatusMessage?.(`Upload encountered ${res.validation_errors.length} validation errors.`, 'error')
      }
    } catch (err) {
      setUploadStatus(`Format Error: ${err.message}`)
      onStatusMessage?.('Invalid data format: ' + err.message, 'error')
    }
  }

  async function handleResetOccurrences() {
    if (!window.confirm('Reset occurrences repository to default verified GSI occurrences?')) return
    try {
      const res = await resetOccurrences()
      onStatusMessage?.(res.message, 'info')
      await loadData()
    } catch (err) {
      onStatusMessage?.('Reset failed: ' + err.message, 'error')
    }
  }

  function exportTargetsCSV() {
    if (!results?.targets?.length) return
    const headers = [
      'Target ID',
      'Classification Designation',
      'Prospectivity Score',
      'Confidence %',
      'Latitude',
      'Longitude',
      'Estimated Area (ha)',
      'Dominant Indirect Indicator',
      'Fe-Oxide Score',
      'Clay Alteration Score',
      'Lineament Density Score',
      'Terrain Slope Score',
      'Recommended Field Verification Protocol',
    ]
    const rows = results.targets.map(t => [
      t.target_id,
      `"${t.designation || 'prospective area for field verification'}"`,
      t.prospectivity_score,
      t.confidence_pct,
      t.latitude,
      t.longitude,
      t.estimated_area_ha,
      `"${t.dominant_indicator}"`,
      t.evidence_breakdown?.ferric_iron_oxide ?? '',
      t.evidence_breakdown?.clay_hydroxyl_alteration ?? '',
      t.evidence_breakdown?.structural_lineament_density ?? '',
      t.evidence_breakdown?.terrain_slope_suitability ?? '',
      `"${t.recommended_validation}"`,
    ])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orevision-prospective-targets-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    onStatusMessage?.('Exported prospective targets CSV report.', 'success')
  }

  const isModelTrained = status?.model_status === 'trained'
  const isMinPointsMet = (status?.occurrences_count || 0) >= (status?.min_occurrences_required || 5)
  const rfMetrics = status?.model_metrics?.random_forest
  const xgbMetrics = status?.model_metrics?.xgboost
  const importances = status?.model_metrics?.feature_importances || {}

  return (
    <div className="prospectivity-layout" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Mission Stage Tracker (01 Acquire, 02 Analyze, 03 Prioritise) ── */}
      <div className="mission-stage-header card">
        <div className="stage-step done">
          <span className="step-num">01</span>
          <span className="step-title">01 Acquire</span>
          <span className="step-tag">Copernicus S2</span>
        </div>
        <div className="stage-arrow">→</div>
        <div className="stage-step active">
          <span className="step-num">02</span>
          <span className="step-title">02 Analyze</span>
          <span className="step-tag">{modelType.toUpperCase()} · Spatial CV</span>
        </div>
        <div className="stage-arrow">→</div>
        <div className="stage-step">
          <span className="step-num">03</span>
          <span className="step-title">03 Prioritise</span>
          <span className="step-tag">Field Targets</span>
        </div>
      </div>

      {/* ── Scientific Problem Framing Alert ─────── */}
      <div className="alert alert-info">
        <span className="alert-icon">🧭</span>
        <div>
          <strong>Manganese Remote Sensing Methodology:</strong> Manganese deposits are not directly detectable from orbit.
          OreVision AI synthesizes indirect indicators—ferric iron oxides (B04/B02 gossans), hydroxyl clay alteration (B11/B12),
          SAR structural lineament density, and DEM terrain slope—ranking prospective areas for ground exploration.
          Outputs are classified as <em>"prospective area for field verification"</em>.
        </div>
      </div>

      {/* ── Minimum Labelled Points Guard Banner (Honesty Rule) ─── */}
      {!isMinPointsMet && (
        <div className="alert alert-amber">
          <span className="alert-icon">⚠️</span>
          <div>
            <strong>Model not yet trained:</strong> Minimum 5 verified positive manganese occurrences are required to calibrate the pipeline.
            Currently {status?.occurrences_count || 0} occurrences exist. Please upload verified GSI Bhukosh points below or click "Reset to Defaults".
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <div><strong>Analysis Error:</strong> {error}</div>
        </div>
      )}

      {/* ── Interactive Prospectivity Map (Honesty Guarded) ────────── */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">🗺️ Manganese Prospectivity Map & Evidence Layers</div>
            <div className="card-subtitle">
              Pilot Area: Keonjhar–Sundargarh, Odisha · Spatial Block Cross-Validated AI/ML Pipeline
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {!isModelTrained || !isMinPointsMet ? (
              <span className="badge badge-amber">Model not yet trained</span>
            ) : results ? (
              <span className="badge badge-rose">
                {results.total_targets} Prospective Area(s) Delineated
              </span>
            ) : (
              <span className="badge badge-violet">Spatial Block CV Validated · Ready</span>
            )}
          </div>
        </div>

        {/* Data Layer Toggles */}
        <div className="data-layers-bar">
          <span className="layer-bar-title">LAYER TOGGLES:</span>
          <button
            className={`btn btn-xs ${showProspectivityLayer ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowProspectivityLayer(!showProspectivityLayer)}
            disabled={!results}
          >
            🔥 Prospectivity Raster
          </button>
          <button
            className={`btn btn-xs ${showUncertaintyLayer ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowUncertaintyLayer(!showUncertaintyLayer)}
            disabled={!results?.uncertainty_heatmap_base64}
            title="Ensemble variance across decision trees"
          >
            📊 Uncertainty (Tree Variance)
          </button>
          <button
            className={`btn btn-xs ${showMaskLayer ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowMaskLayer(!showMaskLayer)}
            disabled={!results?.applicability_mask_base64}
            title="Excludes dense vegetation canopy & water"
          >
            🛡️ Applicability Mask
          </button>
          <button
            className={`btn btn-xs ${showOccurrencesLayer ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowOccurrencesLayer(!showOccurrencesLayer)}
          >
            🟢 GSI Ground Truth ({occurrences.length})
          </button>
        </div>

        {/* Leaflet Map with Georeferenced Overlays */}
        <InteractiveMap
          bbox={bbox}
          onBBoxChange={setBbox}
          height={400}
          isScanning={analyzing}
          requestStage={analyzing ? 'process' : null}
          overlayImage={showProspectivityLayer && results ? results.heatmap_base64 : null}
          uncertaintyImage={showUncertaintyLayer && results ? results.uncertainty_heatmap_base64 : null}
          maskImage={showMaskLayer && results ? results.applicability_mask_base64 : null}
          occurrences={showOccurrencesLayer ? occurrences : []}
          targets={results ? results.targets : []}
          selectedTargetId={selectedTarget?.target_id}
          onSelectTarget={setSelectedTarget}
        />

        {/* Map Legend (Permanganate + Rhodochrosite System) */}
        <div className="map-legend-strip">
          <div className="legend-item">
            <span className="legend-color-box" style={{ background: '#8B5CF6' }} />
            <span>Low Prospectivity (&lt; 0.35)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-box" style={{ background: '#C9D1E0' }} />
            <span>Moderate Prospectivity (0.35–0.65)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-box" style={{ background: '#F472A8' }} />
            <span>High Prospectivity (&ge; 0.65)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-circle" style={{ background: '#6EE7A8' }} />
            <span>Verified GSI Occurrence</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-circle" style={{ background: '#F472A8', border: '2px solid white' }} />
            <span>Prospective Target for Verification</span>
          </div>
        </div>
      </div>

      {/* ── Exploration Controls & ML Model Selection ─ */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">⚙️ Prospectivity Pipeline Parameters</div>
          <span className="badge badge-violet">PU LEARNING FRAMEWORK</span>
        </div>

        <div className="form-row" style={{ alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Algorithm Architecture</label>
            <select
              value={modelType}
              onChange={e => setModelType(e.target.value)}
              className="form-select"
            >
              <option value="random_forest">Random Forest Classifier (140 Trees, Bagging PU)</option>
              <option value="xgboost">XGBoost Classifier (Gradient Boosted Trees, PU Weighted)</option>
              <option value="ensemble">Dual Ensemble (Random Forest + XGBoost Consensus)</option>
            </select>
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Target Detection Cutoff Threshold</span>
              <strong style={{ color: 'var(--color-rhodochrosite)', fontFamily: 'var(--font-mono)' }}>
                {(threshold * 100).toFixed(0)}%
              </strong>
            </label>
            <input
              type="range"
              min="0.30"
              max="0.85"
              step="0.05"
              value={threshold}
              onChange={e => setThreshold(parseFloat(e.target.value))}
              style={{ accentColor: 'var(--color-permanganate)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleRunProspectivity}
              disabled={analyzing || !isMinPointsMet}
              id="btn-run-prospectivity"
            >
              {analyzing ? <><span className="spinner" /> Synthesizing Multi-Indicators...</> : '⚡ Run Prospectivity Analysis'}
            </button>

            <button
              className="btn btn-secondary btn-lg btn-rose-border"
              onClick={handleRetrain}
              disabled={training}
              title="Retrain models using spatial block cross-validation"
            >
              {training ? <><span className="spinner" /> Retraining...</> : '🔄 Retrain Model'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Model Training Status & Spatial Block CV Metrics ── */}
      {status && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">📈 ML Model Training Status & Spatial Validation</div>
              <div className="card-subtitle">
                Spatial Block K-Fold Cross-Validation (Zero Spatial Autocorrelation Leakage)
              </div>
            </div>
            <span className={`badge ${isModelTrained ? 'badge-green' : 'badge-amber'}`}>
              {status.model_status.toUpperCase()}
            </span>
          </div>

          <div className="metrics-summary-grid">
            <div className="metric-box">
              <span className="metric-num text-violet">
                {rfMetrics?.roc_auc ? rfMetrics.roc_auc.toFixed(3) : '—'}
              </span>
              <span className="metric-title">ROC-AUC (Spatial CV)</span>
              <span className="metric-sub">Separability metric</span>
            </div>

            <div className="metric-box">
              <span className="metric-num text-rose">
                {rfMetrics?.pr_auc ? rfMetrics.pr_auc.toFixed(3) : '—'}
              </span>
              <span className="metric-title">PR-AUC (Precision-Recall)</span>
              <span className="metric-sub">Critical for rare discovery</span>
            </div>

            <div className="metric-box">
              <span className="metric-num text-green">
                {rfMetrics?.brier_score ? rfMetrics.brier_score.toFixed(3) : '—'}
              </span>
              <span className="metric-title">Calibration (Brier Score)</span>
              <span className="metric-sub">Lower is better calibrated</span>
            </div>

            <div className="metric-box">
              <span className="metric-num" style={{ color: 'var(--color-ice-white)' }}>
                {status.occurrences_count}
              </span>
              <span className="metric-title">Ground Truth Occurrences</span>
              <span className="metric-sub">GSI & IBM records</span>
            </div>
          </div>

          {xgbMetrics?.available && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.74rem', color: 'var(--color-oxide-silver)', fontFamily: 'var(--font-mono)' }}>
              ⚡ XGBoost Spatial Block CV: ROC-AUC {xgbMetrics.roc_auc?.toFixed(3) || '—'} · PR-AUC {xgbMetrics.pr_auc?.toFixed(3) || '—'} · Brier {xgbMetrics.brier_score?.toFixed(3) || '—'}
            </div>
          )}

          {/* Feature Importances Bar Meters */}
          {Object.keys(importances).length > 0 && (
            <div style={{ marginTop: '1.2rem' }}>
              <div className="form-label" style={{ marginBottom: '0.6rem' }}>
                INDIRECT INDICATOR FEATURE IMPORTANCES (RANDOM FOREST ENSEMBLE):
              </div>
              <div className="feature-importance-list">
                {Object.entries(importances).map(([k, v]) => (
                  <div key={k} className="feature-meter-row">
                    <span className="feature-name">
                      {k.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <div className="meter-track">
                      <div
                        className="meter-fill"
                        style={{ width: `${Math.min(100, (v / 0.30) * 100)}%` }}
                      />
                    </div>
                    <span className="meter-pct">{(v * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Evidence Breakdown Panel (Target Inspector) ── */}
      {selectedTarget && (
        <div className="card target-evidence-panel">
          <div className="card-header">
            <div>
              <div className="card-title text-rose">
                🎯 Target Evidence Inspector: {selectedTarget.target_id}
              </div>
              <div className="card-subtitle">
                Coordinates: {selectedTarget.latitude.toFixed(4)}°N, {selectedTarget.longitude.toFixed(4)}°E ·
                Estimated Prospective Area: {selectedTarget.estimated_area_ha} ha
              </div>
            </div>
            <button
              className="btn btn-secondary btn-xs"
              onClick={() => setSelectedTarget(null)}
            >
              ✕ Close
            </button>
          </div>

          <div className="target-designation-badge">
            OFFICIAL CLASSIFICATION: <strong>{selectedTarget.designation || 'prospective area for field verification'}</strong>
          </div>

          <div className="evidence-metrics-grid">
            <div className="evidence-metric">
              <span className="metric-label">PROSPECTIVITY SCORE</span>
              <span className="metric-val text-rose">
                {(selectedTarget.prospectivity_score * 100).toFixed(1)}%
              </span>
            </div>
            <div className="evidence-metric">
              <span className="metric-label">MODEL CONFIDENCE</span>
              <span className="metric-val text-green">
                {selectedTarget.confidence_pct}%
              </span>
            </div>
            <div className="evidence-metric">
              <span className="metric-label">DOMINANT INDICATOR</span>
              <span className="metric-val text-violet">
                {selectedTarget.dominant_indicator}
              </span>
            </div>
          </div>

          {/* Indicator Breakdown Meters */}
          {selectedTarget.evidence_breakdown && (
            <div style={{ marginTop: '1rem' }}>
              <div className="form-label" style={{ marginBottom: '0.5rem' }}>
                MULTI-CRITERIA EVIDENCE CONVERGENCE BREAKDOWN:
              </div>
              <div className="feature-importance-list">
                {Object.entries(selectedTarget.evidence_breakdown).map(([key, score]) => (
                  <div key={key} className="feature-meter-row">
                    <span className="feature-name">
                      {key.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <div className="meter-track">
                      <div
                        className="meter-fill meter-fill-rose"
                        style={{ width: `${Math.min(100, score)}%` }}
                      />
                    </div>
                    <span className="meter-pct">{score}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="recommendation-box" style={{ marginTop: '1rem' }}>
            <strong>RECOMMENDED FIELD VERIFICATION PROTOCOL:</strong>
            <p style={{ marginTop: '0.3rem', color: 'var(--color-oxide-silver)' }}>
              {selectedTarget.recommended_validation}
            </p>
          </div>
        </div>
      )}

      {/* ── Ranked Exploration Targets Table ──────── */}
      {results && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">📋 Prospective Areas Ranked for Follow-up Field Exploration</div>
              <div className="card-subtitle">
                Click any row to inspect indirect indicators driving that zone
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={exportTargetsCSV}
            >
              📥 Export Targets CSV
            </button>
          </div>

          {results.targets.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div className="empty-state-title" style={{ fontWeight: 600, color: 'var(--color-ice-white)' }}>
                No prospective zones above cutoff threshold
              </div>
              <div className="empty-state-desc" style={{ fontSize: '0.82rem', color: 'var(--color-oxide-silver)', marginTop: '0.4rem' }}>
                Try lowering the threshold slider (e.g. to 45%) to inspect lower-confidence prospective anomalies.
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Target ID</th>
                    <th>Designation</th>
                    <th>Score</th>
                    <th>Confidence</th>
                    <th>Coords (Lat, Lon)</th>
                    <th>Est. Area</th>
                    <th>Dominant Indicator</th>
                  </tr>
                </thead>
                <tbody>
                  {results.targets.map(t => (
                    <tr
                      key={t.target_id}
                      onClick={() => setSelectedTarget(t)}
                      className={selectedTarget?.target_id === t.target_id ? 'row-selected' : ''}
                      style={{ cursor: 'pointer' }}
                    >
                      <td><strong className="text-rose">{t.target_id}</strong></td>
                      <td><span className="badge badge-graphite" style={{ fontSize: '0.65rem' }}>{t.designation}</span></td>
                      <td><span className="text-violet font-mono">{(t.prospectivity_score * 100).toFixed(1)}%</span></td>
                      <td><span className="text-green font-mono">{t.confidence_pct}%</span></td>
                      <td className="font-mono">{t.latitude.toFixed(4)}, {t.longitude.toFixed(4)}</td>
                      <td>{t.estimated_area_ha} ha</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--color-oxide-silver)' }}>{t.dominant_indicator}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="disclaimer-note" style={{ marginTop: '1rem' }}>
            ⚖️ <em>{results.disclaimer}</em>
          </div>
        </div>
      )}

      {/* ── GSI Ground Truth & Bhukosh Upload Section ── */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">🗂️ Ground Truth Occurrences Repository</div>
            <div className="card-subtitle">
              Geological Survey of India (GSI Bhukosh) & Indian Bureau of Mines Verified Records
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowUploader(!showUploader)}
            >
              {showUploader ? '▲ Hide Uploader' : '⬆️ Upload GSI / IBM Records'}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleDownloadTemplate}
            >
              📄 CSV Template
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleResetOccurrences}
            >
              🔄 Reset to Defaults
            </button>
          </div>
        </div>

        {/* Uploader Drawer */}
        {showUploader && (
          <div className="uploader-drawer">
            <div className="form-group">
              <label className="form-label">
                Paste GSI Bhukosh CSV or GeoJSON FeatureCollection:
              </label>
              <textarea
                rows={5}
                className="form-textarea font-mono"
                placeholder="name,district,state,latitude,longitude,geological_formation,ore_type,grade,status&#10;Barabil Mine,Kendujhar,Odisha,22.1245,85.3852,IOG Shales,Pyrolusite,42% Mn,Active Mine"
                value={uploadText}
                onChange={e => setUploadText(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.6rem' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleUploadOccurrences}
              >
                ✓ Validate & Integrate Occurrences
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setUploadText('')}
              >
                Clear
              </button>
            </div>

            {uploadStatus && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: uploadErrors.length ? '#EF4444' : 'var(--color-verified-green)' }}>
                {uploadStatus}
              </div>
            )}
            {uploadErrors.length > 0 && (
              <ul style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#EF4444', paddingLeft: '1.2rem' }}>
                {uploadErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Occurrences Table Preview */}
        <div className="table-responsive" style={{ maxHeight: '240px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name / Deposit</th>
                <th>District / State</th>
                <th>Coords (Lat, Lon)</th>
                <th>Host Formation</th>
                <th>Ore Type & Grade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {occurrences.slice(0, 15).map(o => (
                <tr key={o.id}>
                  <td className="font-mono text-green">{o.id}</td>
                  <td><strong>{o.name}</strong></td>
                  <td style={{ color: 'var(--color-oxide-silver)' }}>{o.district}, {o.state}</td>
                  <td className="font-mono">{o.latitude.toFixed(4)}, {o.longitude.toFixed(4)}</td>
                  <td>{o.geological_formation}</td>
                  <td>{o.ore_type} ({o.grade})</td>
                  <td><span className="badge badge-graphite" style={{ fontSize: '0.65rem' }}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
