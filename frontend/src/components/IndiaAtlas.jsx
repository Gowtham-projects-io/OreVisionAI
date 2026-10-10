import { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Rectangle, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchIndiaMineralSummary, fetchIndiaStatesAndDistricts } from '../api'

const INDIA_CENTER = { lat: 21.0, lng: 79.5 }
const DEFAULT_ZOOM = 5

function MapZoomController({ targetBbox, center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (targetBbox) {
      map.fitBounds([
        [targetBbox.south, targetBbox.west],
        [targetBbox.north, targetBbox.east],
      ], { padding: [30, 30], maxZoom: 11 })
    } else if (center) {
      map.setView([center.lat, center.lng], zoom || 6)
    }
  }, [targetBbox, center, zoom, map])
  return null
}

export default function IndiaAtlas({ onSelectAOI, onNavigateTab, onStatusMessage }) {
  const [summary, setSummary] = useState(null)
  const [states, setStates] = useState([])
  const [_loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Selection states
  const [selectedStateId, setSelectedStateId] = useState('OD') // Default to Odisha
  const [selectedDistrictId, setSelectedDistrictId] = useState('OD-KJ') // Default to Kendujhar (Keonjhar)
  const [searchQuery, setSearchQuery] = useState('')
  const [basemap, setBasemap] = useState('satellite') // 'satellite' | 'dark'

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const [sumData, statesData] = await Promise.all([
          fetchIndiaMineralSummary().catch(() => null),
          fetchIndiaStatesAndDistricts().catch(() => ({ states: [] })),
        ])
        if (!ignore) {
          setSummary(sumData)
          setStates(statesData?.states || [])
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load India Mineral Atlas data.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  // Active selected state and district
  const selectedState = useMemo(() => {
    return states.find(s => s.state_id === selectedStateId) || states[0] || null
  }, [states, selectedStateId])

  const selectedDistrict = useMemo(() => {
    if (!selectedState) return null
    return selectedState.districts?.find(d => d.district_id === selectedDistrictId) || selectedState.districts?.[0] || null
  }, [selectedState, selectedDistrictId])

  // Filtered states/districts based on search query
  const filteredStates = useMemo(() => {
    if (!searchQuery.trim()) return states
    const q = searchQuery.toLowerCase()
    return states.filter(s =>
      s.state_name.toLowerCase().includes(q) ||
      s.dominant_belt.toLowerCase().includes(q) ||
      s.districts.some(d => d.district_name.toLowerCase().includes(q) || d.ore_mineralogy.toLowerCase().includes(q))
    )
  }, [states, searchQuery])

  function handleSelectState(state) {
    setSelectedStateId(state.state_id)
    if (state.districts?.length) {
      setSelectedDistrictId(state.districts[0].district_id)
    }
  }

  function handleSelectDistrict(district, stateId) {
    if (stateId) setSelectedStateId(stateId)
    setSelectedDistrictId(district.district_id)
  }

  function handleSendToExplorer() {
    if (!selectedDistrict?.bbox) return
    onSelectAOI?.(selectedDistrict.bbox)
    onNavigateTab?.('explorer')
    onStatusMessage?.(`Set AOI to ${selectedDistrict.district_name}, ${selectedState.state_name}. Launched Satellite Explorer.`, 'success')
  }

  function handleSendToProspectivity() {
    if (!selectedDistrict?.bbox) return
    onSelectAOI?.(selectedDistrict.bbox)
    onNavigateTab?.('prospectivity')
    onStatusMessage?.(`Loaded ${selectedDistrict.district_name} into AI/ML Prospectivity Pipeline.`, 'success')
  }

  function exportDistrictJSON() {
    if (!selectedDistrict) return
    const blob = new Blob([JSON.stringify(selectedDistrict, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orevision-${selectedDistrict.district_id}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    onStatusMessage?.(`Exported ${selectedDistrict.district_name} mineral dossier.`, 'info')
  }

  const basemapUrls = {
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    dark: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  }

  return (
    <div className="india-atlas-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── National Banner & Header ──────────────── */}
      <div className="card india-national-header">
        <div className="card-header">
          <div>
            <div className="card-title" style={{ fontSize: '1.25rem' }}>
              🇮🇳 India National Manganese Mineral Intelligence Atlas
            </div>
            <div className="card-subtitle">
              Live State & District Telemetry · GSI Bhukosh Verified Occurrences · IBM National Reserve Data
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-green">LIVE GSI REPOSITORY</span>
            <span className="badge badge-violet">PAN-INDIA COVERAGE</span>
          </div>
        </div>

        {/* National Metric Strip */}
        {summary && (
          <div className="metrics-summary-grid" style={{ marginTop: '0.85rem' }}>
            <div className="metric-box">
              <span className="metric-num text-rose">
                {summary.total_estimated_reserves_mt} <span style={{ fontSize: '0.9rem' }}>MT</span>
              </span>
              <span className="metric-title">National Resources</span>
              <span className="metric-sub">Indian Bureau of Mines</span>
            </div>

            <div className="metric-box">
              <span className="metric-num text-violet">
                {summary.total_producing_states}
              </span>
              <span className="metric-title">Producing States</span>
              <span className="metric-sub">9 Mineral Provinces</span>
            </div>

            <div className="metric-box">
              <span className="metric-num text-green">
                {summary.total_priority_districts}
              </span>
              <span className="metric-title">Mining Districts</span>
              <span className="metric-sub">High Priority Belts</span>
            </div>

            <div className="metric-box">
              <span className="metric-num text-silver">
                {summary.verified_gsi_occurrences_count}
              </span>
              <span className="metric-title">GSI Verified Occurrences</span>
              <span className="metric-sub">Bhukosh Calibrated</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <div>{error}</div>
        </div>
      )}

      {/* ── Search & Filter Bar ───────────────────── */}
      <div className="card" style={{ padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="🔍 Search India states, districts (e.g., Keonjhar, Balaghat, Sausar, Sandur)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-oxide-silver)', fontFamily: 'var(--font-mono)' }}>
              BASEMAP:
            </span>
            <button
              className={`btn btn-xs ${basemap === 'satellite' ? 'btn-active-violet' : 'btn-ghost'}`}
              onClick={() => setBasemap('satellite')}
            >
              🛰️ Satellite
            </button>
            <button
              className={`btn btn-xs ${basemap === 'dark' ? 'btn-active-violet' : 'btn-ghost'}`}
              onClick={() => setBasemap('dark')}
            >
              🗺️ Psilomelane Dark
            </button>
          </div>
        </div>
      </div>

      {/* ── Interactive Map of India (Separate Page Canvas) ── */}
      <div className="card" style={{ padding: '1rem' }}>
        <div className="card-header" style={{ marginBottom: '0.75rem' }}>
          <div>
            <div className="card-title">
              🗺️ National Manganese Distribution Canvas
            </div>
            <div className="card-subtitle">
              {selectedDistrict
                ? `Zoomed on ${selectedDistrict.district_name}, ${selectedState?.state_name} · Click pins to view deposit records`
                : 'Click any state or district marker to inspect local geology'}
            </div>
          </div>

          {selectedDistrict && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSendToExplorer}
                title="Transfer AOI to Satellite Explorer"
              >
                🛰️ Explore in Satellite Explorer
              </button>
              <button
                className="btn btn-secondary btn-sm btn-rose-border"
                onClick={handleSendToProspectivity}
                title="Transfer AOI to AI/ML Prospectivity"
              >
                ⚡ Run Prospectivity AI
              </button>
            </div>
          )}
        </div>

        <div className="map-wrapper" style={{ height: 480 }}>
          <MapContainer
            center={[INDIA_CENTER.lat, INDIA_CENTER.lng]}
            zoom={DEFAULT_ZOOM}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              key={basemap}
              url={basemapUrls[basemap]}
              attribution="&copy; Esri, Maxar & OpenStreetMap"
              className={basemap === 'dark' ? 'osm-dark-tiles' : ''}
              maxZoom={18}
            />

            <MapZoomController
              targetBbox={selectedDistrict?.bbox}
              center={selectedDistrict?.center || selectedState?.center}
              zoom={selectedDistrict ? 9 : 6}
            />

            {/* Selected District Boundary Rectangle (Rhodochrosite Rose Outline) */}
            {selectedDistrict?.bbox && (
              <Rectangle
                bounds={[
                  [selectedDistrict.bbox.south, selectedDistrict.bbox.west],
                  [selectedDistrict.bbox.north, selectedDistrict.bbox.east],
                ]}
                pathOptions={{
                  color: '#F472A8',
                  fillColor: '#F472A8',
                  fillOpacity: 0.12,
                  weight: 2.5,
                }}
              />
            )}

            {/* State Hub Markers across India */}
            {states.map(st => {
              const isSelected = st.state_id === selectedStateId
              return (
                <CircleMarker
                  key={st.state_id}
                  center={[st.center.lat, st.center.lng]}
                  radius={isSelected ? 14 : 9}
                  eventHandlers={{
                    click: () => handleSelectState(st),
                  }}
                  pathOptions={{
                    color: isSelected ? '#FFFFFF' : '#8B5CF6',
                    fillColor: '#8B5CF6',
                    fillOpacity: isSelected ? 0.95 : 0.75,
                    weight: isSelected ? 3 : 1.5,
                  }}
                >
                  <Popup>
                    <div className="map-popup-card">
                      <div className="map-popup-tag text-violet">
                        STATE: {st.state_name.toUpperCase()}
                      </div>
                      <strong>{st.dominant_belt}</strong>
                      <div style={{ fontSize: '0.74rem', marginTop: '3px' }}>
                        <strong>Reserves:</strong> {st.estimated_reserves_mt} MT ({st.national_share_pct}% national share)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-oxide-silver)', marginTop: '2px' }}>
                        Districts: {st.districts.map(d => d.district_name).join(', ')}
                      </div>
                      <div style={{ marginTop: '6px' }}>
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={() => handleSelectState(st)}
                        >
                          Select State
                        </button>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}

            {/* District Hub Markers */}
            {states.flatMap(st =>
              st.districts.map(dt => {
                const isSelected = dt.district_id === selectedDistrictId
                return (
                  <CircleMarker
                    key={dt.district_id}
                    center={[dt.center.lat, dt.center.lng]}
                    radius={isSelected ? 10 : 6}
                    eventHandlers={{
                      click: () => handleSelectDistrict(dt, st.state_id),
                    }}
                    pathOptions={{
                      color: isSelected ? '#FFFFFF' : '#F472A8',
                      fillColor: '#F472A8',
                      fillOpacity: isSelected ? 1.0 : 0.8,
                      weight: isSelected ? 3 : 1.5,
                    }}
                  >
                    <Popup>
                      <div className="map-popup-card">
                        <div className="map-popup-tag text-rose">
                          DISTRICT: {dt.district_name.toUpperCase()}
                        </div>
                        <strong>{dt.geological_formation}</strong>
                        <div style={{ fontSize: '0.74rem', marginTop: '3px' }}>
                          <strong>Grade:</strong> {dt.average_grade} · <strong>Reserve:</strong> {dt.reserve_mt} MT
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-oxide-silver)', marginTop: '2px' }}>
                          Mines: {dt.key_mines.join(', ')}
                        </div>
                        <div style={{ marginTop: '6px' }}>
                          <button
                            className="btn btn-xs btn-rose-accent"
                            onClick={() => handleSelectDistrict(dt, st.state_id)}
                          >
                            Inspect District
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })
            )}

            {/* Verified GSI Occurrences Pins across India (Verified Green) */}
            {selectedDistrict?.occurrences?.map(occ => (
              <CircleMarker
                key={occ.id}
                center={[occ.latitude, occ.longitude]}
                radius={5}
                pathOptions={{
                  color: '#6EE7A8',
                  fillColor: '#6EE7A8',
                  fillOpacity: 0.95,
                  weight: 1.5,
                }}
              >
                <Popup>
                  <div className="map-popup-card">
                    <div className="map-popup-tag text-green">
                      ✓ Verified GSI Ground Truth ({occ.id})
                    </div>
                    <strong>{occ.name}</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-oxide-silver)', marginTop: '2px' }}>
                      {occ.district}, {occ.state}
                    </div>
                    <div style={{ fontSize: '0.72rem', marginTop: '3px' }}>
                      <strong>Formation:</strong> {occ.geological_formation}
                    </div>
                    <div style={{ fontSize: '0.72rem' }}>
                      <strong>Ore:</strong> {occ.ore_type} ({occ.grade})
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Map Legend */}
        <div className="map-legend-strip">
          <div className="legend-item">
            <span className="legend-color-circle" style={{ background: '#8B5CF6' }} />
            <span>State Mineral Centers (Permanganate Violet)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-circle" style={{ background: '#F472A8' }} />
            <span>Mining District Hubs (Rhodochrosite Rose)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-circle" style={{ background: '#6EE7A8' }} />
            <span>Verified GSI Bhukosh Deposits (Verified Green)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-box" style={{ border: '1.5px solid #F472A8', background: 'rgba(244,114,168,0.15)' }} />
            <span>Selected District AOI Footprint</span>
          </div>
        </div>
      </div>

      {/* ── Two-Column Layout: State Navigator & District Deep-Dive ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>

        {/* 1. State Selector & Regional Belts */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🏛️ India Manganese Producing States</div>
              <div className="card-subtitle">Select a state to explore its mineral districts</div>
            </div>
            <span className="badge badge-violet">{filteredStates.length} States</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '520px', overflowY: 'auto' }}>
            {filteredStates.map(st => {
              const isSelected = st.state_id === selectedStateId
              return (
                <div
                  key={st.state_id}
                  className={`scene-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectState(st)}
                  style={{
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: '0.5rem',
                    borderColor: isSelected ? 'var(--color-permanganate)' : 'rgba(139, 92, 246, 0.14)',
                    background: isSelected ? 'rgba(139, 92, 246, 0.12)' : 'var(--color-pyrolusite)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.95rem', color: isSelected ? 'var(--color-permanganate)' : 'var(--color-ice-white)' }}>
                        {st.state_name}
                      </strong>
                      <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>
                        {st.national_share_pct}% National Share
                      </span>
                    </div>
                    <span className="font-mono text-rose" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      {st.estimated_reserves_mt} MT
                    </span>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--color-oxide-silver)' }}>
                    <strong>Geological Belt:</strong> {st.dominant_belt}
                  </div>

                  {/* District Quick-Select Pills */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                    {st.districts.map(dt => (
                      <button
                        key={dt.district_id}
                        type="button"
                        className={`btn btn-xs ${selectedDistrictId === dt.district_id ? 'btn-active-violet' : 'btn-ghost'}`}
                        style={{ fontSize: '0.68rem', padding: '2px 8px', minHeight: '28px' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectDistrict(dt, st.state_id)
                        }}
                      >
                        📍 {dt.district_name} ({dt.reserve_mt} MT)
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 2. District Live Intelligence Dossier */}
        {selectedDistrict && (
          <div className="card target-evidence-panel">
            <div className="card-header">
              <div>
                <div className="card-title text-rose">
                  🔍 District Intelligence Dossier: {selectedDistrict.district_name}
                </div>
                <div className="card-subtitle">
                  {selectedState?.state_name} · Bounding Box: [{selectedDistrict.bbox.west}°E, {selectedDistrict.bbox.south}°N → {selectedDistrict.bbox.east}°E, {selectedDistrict.bbox.north}°N]
                </div>
              </div>
              <button
                className="btn btn-secondary btn-xs"
                onClick={exportDistrictJSON}
              >
                📥 Export Dossier JSON
              </button>
            </div>

            {/* Key District Metrics Strip */}
            <div className="evidence-metrics-grid">
              <div className="evidence-metric">
                <span className="metric-label">ESTIMATED RESERVES</span>
                <span className="metric-val text-rose">
                  {selectedDistrict.reserve_mt} MT
                </span>
              </div>
              <div className="evidence-metric">
                <span className="metric-label">AI PROSPECTIVITY INDEX</span>
                <span className="metric-val text-violet font-mono">
                  {(selectedDistrict.prospectivity_index * 100).toFixed(0)}%
                </span>
              </div>
              <div className="evidence-metric">
                <span className="metric-label">GSI VERIFIED DEPOSITS</span>
                <span className="metric-val text-green font-mono">
                  {selectedDistrict.verified_occurrences_count || selectedDistrict.occurrences?.length || 0}
                </span>
              </div>
            </div>

            {/* Detailed Geology Readout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.8rem' }}>
              <div className="details-card">
                <span className="details-label">HOST GEOLOGICAL FORMATION</span>
                <span className="details-val" style={{ color: 'var(--color-ice-white)' }}>
                  {selectedDistrict.geological_formation}
                </span>
              </div>

              <div className="details-card">
                <span className="details-label">ORE MINERALOGY & FACIES</span>
                <span className="details-val" style={{ color: 'var(--color-rhodochrosite)' }}>
                  {selectedDistrict.ore_mineralogy}
                </span>
              </div>

              <div className="details-card">
                <span className="details-label">AVERAGE GRADE & BENEFICIATION</span>
                <span className="details-val">
                  {selectedDistrict.average_grade}
                </span>
              </div>

              <div className="details-card">
                <span className="details-label">KEY MINING CLUSTERS & OPERATIONS</span>
                <span className="details-val" style={{ color: 'var(--color-oxide-silver)' }}>
                  {selectedDistrict.key_mines.join(' · ')}
                </span>
              </div>

              <div className="details-card">
                <span className="details-label">COPERNICUS SENTINEL-2 MGRS TILES</span>
                <span className="details-val font-mono" style={{ color: 'var(--color-permanganate)' }}>
                  {selectedDistrict.copernicus_s2_tiles.join(', ')}
                </span>
              </div>
            </div>

            {/* 1-Click Satellite Pipeline Trigger Buttons */}
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary btn-lg"
                style={{ flex: 1 }}
                onClick={handleSendToExplorer}
              >
                🛰️ Open in Satellite Explorer
              </button>
              <button
                className="btn btn-rose-accent btn-lg"
                style={{ flex: 1 }}
                onClick={handleSendToProspectivity}
              >
                ⚡ Run Manganese Prospectivity
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Verified GSI Ground Truth Table for Selected District ── */}
      {selectedDistrict?.occurrences?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                🟢 Verified GSI Ground Truth Occurrences in {selectedDistrict.district_name}
              </div>
              <div className="card-subtitle">
                Calibrated ground points from GSI Bhukosh & Indian Bureau of Mines (IBM)
              </div>
            </div>
            <span className="badge badge-green">{selectedDistrict.occurrences.length} Verified Records</span>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Deposit / Mine Name</th>
                  <th>Coordinates (Lat, Lon)</th>
                  <th>Host Formation</th>
                  <th>Ore Type</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {selectedDistrict.occurrences.map(occ => (
                  <tr key={occ.id}>
                    <td className="font-mono text-green">{occ.id}</td>
                    <td><strong>{occ.name}</strong></td>
                    <td className="font-mono">{occ.latitude.toFixed(4)}, {occ.longitude.toFixed(4)}</td>
                    <td>{occ.geological_formation}</td>
                    <td>{occ.ore_type}</td>
                    <td>{occ.grade}</td>
                    <td><span className="badge badge-graphite" style={{ fontSize: '0.65rem' }}>{occ.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
