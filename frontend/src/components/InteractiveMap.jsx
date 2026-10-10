import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Rectangle, ImageOverlay, CircleMarker, Popup, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const INDIA_BOUNDS = { lat: 21.95, lng: 85.35 } // Centered on Keonjhar–Sundargarh Manganese Belt

const PRESETS = [
  { label: '⭐ Keonjhar–Sundargarh (Odisha)', box: { west: 85.05, south: 21.75, east: 85.65, north: 22.35 } },
  { label: 'Balaghat Belt (MP)',             box: { west: 79.50, south: 21.40, east: 80.60, north: 22.20 } },
  { label: 'Nagpur-Bhandara (MH)',           box: { west: 79.00, south: 21.20, east: 79.90, north: 21.80 } },
  { label: 'Sandur Valley (Karnataka)',      box: { west: 76.30, south: 14.90, east: 76.80, north: 15.30 } },
  { label: 'Banswara Belt (Rajasthan)',      box: { west: 74.20, south: 23.30, east: 74.70, north: 23.80 } },
]

const BASEMAP_TILES = {
  satellite: {
    label: '🛰️ Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
    className: '',
  },
  dark: {
    label: '🗺️ Psilomelane Dark',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    className: 'osm-dark-tiles',
  },
  osm: {
    label: '🌍 Standard Topo',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    className: '',
  },
}

function MapController({ bbox }) {
  const map = useMap()
  useEffect(() => {
    if (bbox && bbox.south && bbox.west && bbox.north && bbox.east) {
      map.fitBounds([
        [bbox.south, bbox.west],
        [bbox.north, bbox.east],
      ], { padding: [24, 24], maxZoom: 13 })
    }
  }, [bbox, map])
  return null
}

function BBoxDrawer({ onBBoxChange, bbox, isRoseHighlight = false }) {
  const [drawing, setDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState(null)
  const [tempBBox, setTempBBox] = useState(null)
  const map = useMap()

  useMapEvents({
    mousedown(e) {
      if (e.originalEvent.shiftKey) {
        map.dragging.disable()
        setDrawing(true)
        setStartPoint(e.latlng)
        setTempBBox(null)
      }
    },
    mousemove(e) {
      if (drawing && startPoint) {
        const newBox = {
          south: Math.min(startPoint.lat, e.latlng.lat),
          north: Math.max(startPoint.lat, e.latlng.lat),
          west: Math.min(startPoint.lng, e.latlng.lng),
          east: Math.max(startPoint.lng, e.latlng.lng),
        }
        setTempBBox(newBox)
      }
    },
    mouseup(e) {
      if (drawing && startPoint) {
        map.dragging.enable()
        setDrawing(false)
        const finalBox = {
          south: Math.min(startPoint.lat, e.latlng.lat),
          north: Math.max(startPoint.lat, e.latlng.lat),
          west: Math.min(startPoint.lng, e.latlng.lng),
          east: Math.max(startPoint.lng, e.latlng.lng),
        }
        if (Math.abs(finalBox.north - finalBox.south) > 0.005 &&
            Math.abs(finalBox.east - finalBox.west) > 0.005) {
          onBBoxChange(finalBox)
        }
        setStartPoint(null)
        setTempBBox(null)
      }
    },
  })

  const displayBox = tempBBox || bbox
  if (!displayBox) return null

  // Rhodochrosite Rose (#F472A8) for selected area exploration boundary
  const outlineColor = isRoseHighlight ? '#F472A8' : '#8B5CF6'

  return (
    <Rectangle
      bounds={[[displayBox.south, displayBox.west], [displayBox.north, displayBox.east]]}
      pathOptions={{
        color: outlineColor,
        fillColor: outlineColor,
        fillOpacity: 0.08,
        weight: 2.5,
        dashArray: tempBBox ? '6 4' : null,
      }}
    />
  )
}

export default function InteractiveMap({
  bbox,
  onBBoxChange,
  height = 420,
  isScanning = false,
  overlayImage = null,
  overlayBounds = null,
  uncertaintyImage = null,
  maskImage = null,
  occurrences = [],
  targets = [],
  onSelectTarget = null,
  selectedTargetId = null,
  requestStage = null, // 'catalogue' | 'download' | 'process'
}) {
  const [basemapKey, setBasemapKey] = useState('satellite')
  const activeOverlayBounds = overlayBounds || (bbox ? [[bbox.south, bbox.west], [bbox.north, bbox.east]] : null)
  const currentBasemap = BASEMAP_TILES[basemapKey] || BASEMAP_TILES.satellite

  return (
    <div className="interactive-map-container">
      {/* Top Map Action Bar (Basemap Selector & Presets) */}
      <div className="map-top-bar">
        <div className="basemap-pill-group">
          <span className="bar-subhead">BASEMAP:</span>
          {Object.entries(BASEMAP_TILES).map(([k, cfg]) => (
            <button
              key={k}
              type="button"
              className={`btn btn-xs ${basemapKey === k ? 'btn-active-violet' : 'btn-ghost'}`}
              onClick={() => setBasemapKey(k)}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        <div className="target-sectors-group">
          <span className="bar-subhead">PILOT PRESETS:</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className="btn btn-xs btn-preset-rose"
              onClick={() => onBBoxChange(p.box)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="map-wrapper" style={{ height }}>
        <MapContainer
          center={[INDIA_BOUNDS.lat, INDIA_BOUNDS.lng]}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          {/* Dynamic Free Basemap (No API key required) */}
          <TileLayer
            key={basemapKey}
            url={currentBasemap.url}
            attribution={currentBasemap.attribution}
            className={currentBasemap.className}
            maxZoom={currentBasemap.maxZoom}
          />

          <MapController bbox={bbox} />
          <BBoxDrawer onBBoxChange={onBBoxChange} bbox={bbox} isRoseHighlight={Boolean(overlayImage || targets.length)} />

          {/* Real Satellite Composite Raster */}
          {overlayImage && activeOverlayBounds && (
            <ImageOverlay
              url={`data:image/png;base64,${overlayImage}`}
              bounds={activeOverlayBounds}
              opacity={0.88}
              zIndex={400}
            />
          )}

          {/* Uncertainty Raster Overlay */}
          {uncertaintyImage && activeOverlayBounds && (
            <ImageOverlay
              url={`data:image/png;base64,${uncertaintyImage}`}
              bounds={activeOverlayBounds}
              opacity={0.72}
              zIndex={410}
            />
          )}

          {/* Applicability Mask Overlay */}
          {maskImage && activeOverlayBounds && (
            <ImageOverlay
              url={`data:image/png;base64,${maskImage}`}
              bounds={activeOverlayBounds}
              opacity={0.65}
              zIndex={420}
            />
          )}

          {/* Verified GSI Ground Truth Occurrences: Verified Green (#6EE7A8) */}
          {occurrences.map((occ, idx) => (
            <CircleMarker
              key={occ.id || `occ-${idx}`}
              center={[occ.latitude, occ.longitude]}
              radius={6}
              pathOptions={{
                color: '#6EE7A8',
                fillColor: '#6EE7A8',
                fillOpacity: 0.9,
                weight: 1.5,
              }}
            >
              <Popup>
                <div className="map-popup-card">
                  <div className="map-popup-tag text-green">
                    ✓ Verified Ground Truth (GSI)
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
                  <div style={{ fontSize: '0.68rem', color: '#8B5CF6', marginTop: '4px' }}>
                    Source: {occ.source || 'GSI Bhukosh'}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Exploration Targets: Rhodochrosite Rose (#F472A8) with subtle pulse */}
          {targets.map((tgt) => {
            const isSelected = selectedTargetId === tgt.target_id
            return (
              <CircleMarker
                key={tgt.target_id}
                center={[tgt.latitude, tgt.longitude]}
                radius={isSelected ? 10 : 7}
                eventHandlers={{
                  click: () => onSelectTarget?.(tgt),
                }}
                pathOptions={{
                  color: isSelected ? '#FFFFFF' : '#F472A8',
                  fillColor: '#F472A8',
                  fillOpacity: isSelected ? 1.0 : 0.85,
                  weight: isSelected ? 3 : 2,
                }}
              >
                <Popup>
                  <div className="map-popup-card">
                    <div className="map-popup-tag text-rose">
                      ⚡ Prospective Target for Verification
                    </div>
                    <strong>{tgt.target_id}</strong>
                    <div style={{ fontSize: '0.74rem', marginTop: '3px' }}>
                      <strong>Score:</strong> {(tgt.prospectivity_score * 100).toFixed(1)}% · <strong>Conf:</strong> {tgt.confidence_pct}%
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-oxide-silver)', marginTop: '2px' }}>
                      {tgt.dominant_indicator}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#F472A8', marginTop: '3px', fontStyle: 'italic' }}>
                      prospective area for field verification
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>

        {/* ── Soft Violet Scanning Beam & Oxide Dendrite Loader (Runs ONLY during active requests) ── */}
        {isScanning && (
          <div className="scanning-overlay-container" aria-label="Satellite scanning active">
            <div className="soft-violet-scan-beam" />
            
            {/* Signature Manganese Oxide Dendrite Growth (SVG) */}
            <div className="oxide-dendrite-frame">
              <svg viewBox="0 0 400 200" className="dendrite-svg" preserveAspectRatio="none">
                {/* Primary mineral branches growing outward */}
                <path d="M0,100 Q60,95 110,80 T210,65 T310,40 T400,20" className="dendrite-stem" />
                <path d="M0,100 Q70,110 130,130 T240,150 T330,170 T400,185" className="dendrite-stem" />
                {/* Secondary twigs */}
                <path d="M110,80 Q130,60 160,50 T200,35" className="dendrite-branch" />
                <path d="M210,65 Q235,45 270,40" className="dendrite-branch" />
                <path d="M130,130 Q160,150 190,165 T230,180" className="dendrite-branch" />
                <path d="M240,150 Q270,170 300,180" className="dendrite-branch" />
              </svg>
            </div>

            {/* Stage Telemetry Tag */}
            <div className="scanning-stage-tag">
              <span className="pulse-dendrite-dot" />
              <span>
                {requestStage === 'catalogue' && 'STAGE: CDSE CATALOG SEARCH…'}
                {requestStage === 'download' && 'STAGE: STREAMING MULTISPECTRAL BANDS…'}
                {requestStage === 'process' && 'STAGE: RADIOMETRIC MANGANESE RATIOS…'}
                {!requestStage && 'ACQUIRING COPERNICUS SENTINEL OBSERVATION…'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Coordinate & Bounding Box Readout */}
      {bbox && (
        <div className="map-bottom-meta">
          <span className="meta-bbox font-mono">
            BOUNDING BOX: [{bbox.west.toFixed(3)}°E, {bbox.south.toFixed(3)}°N → {bbox.east.toFixed(3)}°E, {bbox.north.toFixed(3)}°N]
          </span>
          <span className="meta-hint">
            💡 Hold <kbd>Shift</kbd> + drag to select area
          </span>
        </div>
      )}
    </div>
  )
}
