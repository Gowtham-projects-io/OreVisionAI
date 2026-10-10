import { useState } from 'react'
import { searchScenes, fetchSatelliteImage } from '../api'
import InteractiveMap from './InteractiveMap'

const VIZ_OPTIONS = [
  { key: 'true_color',      icon: '🌍', label: 'True Colour',           desc: 'B04/B03/B02 · 10m Natural Surface' },
  { key: 'false_color_nir',  icon: '🌿', label: 'False Colour NIR',      desc: 'B08/B04/B03 · Canopy Suppression' },
  { key: 'swir_iron',       icon: '🪨', label: 'SWIR Iron Gossan',      desc: 'B12/B11/B04 · Gossans & Outcrops' },
  { key: 'ferric_iron',     icon: '🔥', label: 'Ferric Iron (B04/B02)',  desc: 'B04/B02 · Fe3+ Oxide Alteration' },
  { key: 'clay_hydroxyl',   icon: '💎', label: 'Clay / OH (B11/B12)',    desc: 'B11/B12 · Weathered Host Shales' },
  { key: 'ferrous_iron',    icon: '🔮', label: 'Ferrous Iron (B11/B8A)', desc: 'B11/B8A · Silicate/Carbonate Host' },
  { key: 'pca_composite',   icon: '✨', label: 'PCA Composite',         desc: 'PC1/PC2/PC3 · Spectral Contrast' },
  { key: 'ndvi',            icon: '📊', label: 'NDVI Vegetation',       desc: '(B08-B04)/(B08+B04) · Masking' },
]

export default function SatelliteExplorer({ onStatusMessage, bbox: externalBbox, onBBoxChange, onNavigateTab }) {
  // Default to Pilot Area: Keonjhar–Sundargarh, Odisha
  const [internalBbox, setInternalBbox] = useState({ west: 85.05, south: 21.75, east: 85.65, north: 22.35 })
  const bbox = externalBbox || internalBbox
  const setBbox = (box) => {
    setInternalBbox(box)
    onBBoxChange?.(box)
  }

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(Date.now() - 60 * 86400000)
    return d.toISOString().slice(0, 10)
  })
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().slice(0, 10)
  })
  const [maxCloud, setMaxCloud] = useState(40)
  const [viz, setViz] = useState('true_color')

  const [scenes, setScenes]               = useState(null)
  const [selectedScene, setSelectedScene] = useState(null)
  const [imageData, setImageData]         = useState(null)
  const [imageMeta, setImageMeta]         = useState(null)
  const [loadingScenes, setLoadingScenes] = useState(false)
  const [loadingImage, setLoadingImage]   = useState(false)
  const [error, setError]                 = useState(null)
  const [imageError, setImageError]       = useState(null)
  const [discoveryLoaded, setDiscoveryLoaded] = useState(false)
  const [requestStage, setRequestStage]   = useState(null) // 'catalogue' | 'download' | 'process' | null

  async function handleSearchScenes() {
    setError(null)
    setScenes(null)
    setImageData(null)
    setSelectedScene(null)
    setLoadingScenes(true)
    setRequestStage('catalogue')
    setDiscoveryLoaded(false)

    try {
      const result = await searchScenes({
        ...bbox, dateFrom, dateTo, maxCloud, maxResults: 20,
      })
      setScenes(result)
      if (result.count === 0) {
        onStatusMessage?.('No Sentinel-2 scenes found for this area and date range.', 'info')
      } else {
        onStatusMessage?.(`Found ${result.count} genuine Sentinel-2 scenes from Copernicus.`, 'success')
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Scene search failed.'
      setError(msg)
      onStatusMessage?.(msg, 'error')
    } finally {
      setLoadingScenes(false)
      setRequestStage(null)
    }
  }

  async function handleFetchImage() {
    setImageError(null)
    setImageData(null)
    setImageMeta(null)
    setLoadingImage(true)
    setRequestStage('download')
    setDiscoveryLoaded(false)

    try {
      // Transition stage to 'process' right before calling processing API
      const resultPromise = fetchSatelliteImage({
        ...bbox, dateFrom, dateTo, visualization: viz, width: 512, height: 512,
      })
      
      // Advance stage to processing after brief transmission
      const timer = setTimeout(() => {
        setRequestStage('process')
      }, 700)

      const result = await resultPromise
      clearTimeout(timer)

      setImageData(result.image_base64)
      setImageMeta(result.metadata)
      setDiscoveryLoaded(true)
      onStatusMessage?.('Genuine satellite observation retrieved from Copernicus Processing API.', 'success')
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Image fetch failed.'
      setImageError(msg)
      onStatusMessage?.(msg, 'error')
    } finally {
      setLoadingImage(false)
      setRequestStage(null)
    }
  }

  const cloudColor = maxCloud <= 20 ? 'var(--color-verified-green)' : maxCloud <= 50 ? 'var(--color-rhodochrosite)' : '#EF4444'

  return (
    <div className="satellite-explorer-layout" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Mission Stage Tracker (01 Acquire, 02 Analyze, 03 Prioritise) ── */}
      <div className="mission-stage-header card">
        <div className="stage-step active">
          <span className="step-num">01</span>
          <span className="step-title">01 Acquire</span>
          <span className="step-tag">Copernicus S2</span>
        </div>
        <div className="stage-arrow">→</div>
        <div className="stage-step">
          <span className="step-num">02</span>
          <span className="step-title">02 Analyze</span>
          <span className="step-tag">Spectral Ratios</span>
        </div>
        <div className="stage-arrow">→</div>
        <div className="stage-step">
          <span className="step-num">03</span>
          <span className="step-title">03 Prioritise</span>
          <span className="step-tag">Field Targets</span>
        </div>
      </div>

      {/* ── Map with Manganese Oxide Dendrite Loader & Soft Violet Scan Beam ── */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">🗺️ Exploration Target Area (AOI)</div>
            <div className="card-subtitle">
              Pilot Area: Keonjhar–Sundargarh, Odisha · Hold Shift + drag on map to custom select
            </div>
          </div>
          {loadingScenes || loadingImage ? (
            <span className="badge badge-violet scanning-badge">
              <span className="pulse-dot" /> {requestStage ? `STAGE: ${requestStage.toUpperCase()}` : 'SCANNING SATELLITE SWATH'}
            </span>
          ) : (
            <span className="badge badge-graphite">COPERNICUS CONNECTED</span>
          )}
        </div>
        <InteractiveMap
          bbox={bbox}
          onBBoxChange={setBbox}
          height={360}
          isScanning={loadingScenes || loadingImage}
          requestStage={requestStage}
          overlayImage={imageData}
        />
      </div>

      {/* ── Search Controls ──────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">🔭 Mission Observation Parameters</div>
          <span className="badge badge-rose">REAL SENTINEL-2 L2A</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Observation Start (Date From)</label>
              <input type="date" value={dateFrom} max={dateTo} onChange={e => setDateFrom(e.target.value)} className="form-input" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Observation End (Date To)</label>
              <input type="date" value={dateTo} min={dateFrom} onChange={e => setDateTo(e.target.value)} className="form-input" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Maximum Cloud Cover Tolerance</span>
              <span style={{ color: cloudColor, fontFamily: 'var(--font-mono)' }}>{maxCloud}%</span>
            </label>
            <input
              type="range" min="0" max="100" value={maxCloud}
              onChange={e => setMaxCloud(Number(e.target.value))}
              style={{ accentColor: cloudColor }}
            />
          </div>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSearchScenes}
            disabled={loadingScenes}
            id="btn-search-scenes"
          >
            {loadingScenes ? <><span className="spinner" /> Scanning Catalog API...</> : '🛰️ Search Real Copernicus Scenes'}
          </button>
        </div>
      </div>

      {/* ── Error Notification ───────────────────── */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <div style={{ width: '100%' }}>
            <div><strong>Scene Catalog Query:</strong> {error}</div>
            {(error.toLowerCase().includes('credential') || error.toLowerCase().includes('not configured')) && (
              <div style={{ marginTop: '0.6rem', fontSize: '0.82rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                <p style={{ margin: '0 0 0.4rem 0' }}>
                  🔑 <strong>How to configure your Copernicus credentials:</strong>
                </p>
                <p style={{ margin: '0 0 0.4rem 0', color: 'var(--color-oxide-silver)' }}>
                  Set your client ID and secret in <code>backend/.env</code>:
                </p>
                <pre style={{ margin: '0 0 0.4rem 0', padding: '0.5rem', background: '#0E0D14', borderRadius: '6px', color: 'var(--color-permanganate)', fontFamily: 'var(--font-mono)' }}>
SH_CLIENT_ID=your-copernicus-client-id{'\n'}
SH_CLIENT_SECRET=your-copernicus-client-secret
                </pre>
                <p style={{ margin: 0, color: 'var(--color-oxide-silver)' }}>
                  OAuth credentials can be registered at{' '}
                  <a href="https://dataspace.copernicus.eu" target="_blank" rel="noreferrer" style={{ color: 'var(--color-permanganate)', textDecoration: 'underline' }}>
                    dataspace.copernicus.eu
                  </a>.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Real Scene Results ───────────────────── */}
      {scenes && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">📡 Real Sentinel-2 Observations in Region</div>
              <div className="card-subtitle">Copernicus Data Space Ecosystem · Sentinel-2 L2A Catalog</div>
            </div>
            <span className="badge badge-violet">{scenes.count} Observations Available</span>
          </div>

          {scenes.count === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛰️</div>
              <div style={{ fontWeight: 600, color: 'var(--color-ice-white)', marginBottom: '0.3rem' }}>
                No Scenes in Selected Temporal Window
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-oxide-silver)' }}>
                Try widening your date range (e.g. 90 days), increasing cloud cover tolerance, or switching to the Keonjhar–Sundargarh pilot preset.
              </div>
            </div>
          ) : (
            <div className="scene-list">
              {scenes.scenes.map(scene => (
                <div
                  key={scene.scene_id}
                  className={`scene-item ${selectedScene?.scene_id === scene.scene_id ? 'selected' : ''}`}
                  onClick={() => setSelectedScene(scene)}
                  id={`scene-${scene.scene_id.slice(-12)}`}
                >
                  <div className="scene-id">{scene.scene_id}</div>
                  <div className="scene-meta">
                    <span className="scene-meta-item">📅 {scene.acquisition_date?.slice(0, 10)}</span>
                    <span className="scene-meta-item">☁️ {scene.cloud_cover?.toFixed(1) ?? '?'}% Cloud</span>
                    <span className="scene-meta-item">🛰️ {scene.platform}</span>
                    <span className="scene-meta-item">📍 Tile {scene.mgrs_tile}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Spectral Composite Selection (250ms crossfade) ─────────── */}
      {scenes && scenes.count > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🔬 Scientifically Validated Spectral Band Visualizations</div>
              <div className="card-subtitle">Select an indirect geological band composite and process genuine pixel data (250ms crossfade)</div>
            </div>
          </div>

          <div className="viz-selector" style={{ marginBottom: '1.2rem' }}>
            {VIZ_OPTIONS.map(v => (
              <button
                key={v.key}
                className={`viz-option ${viz === v.key ? 'active' : ''}`}
                onClick={() => setViz(v.key)}
                id={`viz-${v.key}`}
              >
                <span className="viz-option-icon">{v.icon}</span>
                <strong style={{ color: 'var(--color-ice-white)' }}>{v.label}</strong>
                <small style={{ color: 'var(--color-oxide-silver)' }}>{v.desc}</small>
              </button>
            ))}
          </div>

          <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
            <span className="alert-icon">💡</span>
            <span>
              <strong>Scientific Principle:</strong> Manganese deposits are not directly visible from space.
              Spectral ratios (such as B04/B02 for Fe-oxides and B11/B12 for hydroxyl clay alteration)
              reveal weathered gossan caps and alteration envelopes that often host secondary manganese mineralization.
            </span>
          </div>

          <button
            className="btn btn-rose-accent btn-lg btn-full"
            onClick={handleFetchImage}
            disabled={loadingImage}
            id="btn-fetch-image"
          >
            {loadingImage
              ? <><span className="spinner" /> Querying Sentinel Hub Processing API (512x512)...</>
              : '⚡ Fetch Genuine Sentinel-2 Satellite Composite'}
          </button>

          {imageError && (
            <div className="alert alert-error" style={{ marginTop: '0.85rem' }}>
              <span className="alert-icon">❌</span>
              <div><strong>Processing Error:</strong> {imageError}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Real Satellite Image Result Card with Rose Outline & Observation Loaded ──── */}
      {loadingImage && (
        <div className="card">
          <div className="loading-overlay" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div className="scanning-radar-loader" style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ color: 'var(--color-permanganate)', fontWeight: 600 }}>
              Acquiring multispectral raster from Copernicus Processing API…
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--color-oxide-silver)', marginTop: '0.2rem' }}>
              Applying cloud masking and real Sentinel-2 radiometric calibrations
            </div>
          </div>
        </div>
      )}

      {imageData && imageMeta && !loadingImage && (
        <div className={`card discovery-card ${discoveryLoaded ? 'discovery-reveal-animation' : ''}`}>
          <div className="card-header">
            <div>
              <div className="card-title">🖼️ {imageMeta.label}</div>
              <div className="card-subtitle">{imageMeta.description}</div>
            </div>
            <div className="discovery-pill">
              <span className="discovery-blip" />
              <span>Observation loaded</span>
            </div>
          </div>

          <div className="satellite-image-container">
            <img
              src={`data:image/png;base64,${imageData}`}
              alt={`Real Sentinel-2 observation: ${imageMeta.label}`}
              className="satellite-image"
              id="satellite-image-output"
            />
            <div className="image-overlay-info">
              <div>{imageMeta.data_source}</div>
              <div>{imageMeta.date_from} → {imageMeta.date_to} · {imageMeta.width}×{imageMeta.height}px · Bands: {imageMeta.bands_used?.join(', ')}</div>
            </div>
          </div>

          <div className="observation-details-grid" style={{ marginTop: '1.2rem' }}>
            <div className="details-card">
              <span className="details-label">DATA SOURCE</span>
              <span className="details-val">{imageMeta.data_source}</span>
            </div>
            <div className="details-card">
              <span className="details-label">SPECTRAL BANDS</span>
              <span className="details-val">{imageMeta.bands_used?.join(', ')}</span>
            </div>
            <div className="details-card">
              <span className="details-label">ACQUISITION DATES</span>
              <span className="details-val">{imageMeta.date_from} → {imageMeta.date_to}</span>
            </div>
            <div className="details-card">
              <span className="details-label">RASTER RESOLUTION</span>
              <span className="details-val">{imageMeta.width} × {imageMeta.height} px ({(imageMeta.bytes / 1024).toFixed(1)} KB)</span>
            </div>
          </div>

          <div style={{ marginTop: '1.2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a
              href={`data:image/png;base64,${imageData}`}
              download={`orevision-${imageMeta.visualization}-${imageMeta.date_from}.png`}
              className="btn btn-secondary btn-sm"
              id="btn-download-image"
            >
              ⬇️ Download Observation PNG
            </a>
            {onNavigateTab && (
              <>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onNavigateTab('prospectivity')}
                  id="btn-nav-prospectivity"
                >
                  ⚡ Run Manganese Prospectivity Pipeline on this AOI
                </button>
                <button
                  className="btn btn-secondary btn-sm btn-rose-border"
                  onClick={() => onNavigateTab('change')}
                  id="btn-nav-change"
                >
                  🔄 Multi-Date Surface Disturbance
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
