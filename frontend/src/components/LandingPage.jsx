import React from 'react'

export default function LandingPage({ onLaunchExploration, onViewSatelliteData, onOpenIndiaAtlas }) {
  return (
    <section className="futuristic-hero">
      {/* Background Orbital & Restrained Terrain Grid Visuals */}
      <div className="hero-cosmic-backdrop">
        <div className="cosmic-glow violet-glow" />
        <div className="cosmic-glow rose-glow" />
        <div className="terrain-grid-wireframe" />
        <div className="topographic-contours" />
      </div>

      <div className="hero-content-wrapper">
        {/* Animated OreVision Satellite & Banded Manganese Mineral Crystal Logo */}
        <div className="hero-logo-container">
          <div className="orbital-ring ring-outer">
            <div className="satellite-node" title="Sentinel-2 Satellite in Slow Orbit" />
          </div>
          <div className="orbital-ring ring-mid" />
          <div className="orbital-ring ring-inner" />
          
          <div className="mineral-crystal-core">
            <svg viewBox="0 0 100 100" className="crystal-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Outer Pyrolusite / Psilomelane Facet */}
              <polygon
                points="50,6 90,29 90,71 50,94 10,71 10,29"
                stroke="#8B5CF6"
                strokeWidth="2.5"
                fill="rgba(26, 24, 36, 0.9)"
              />
              {/* Banded Rhodochrosite & Permanganate Crystal Growth Bands */}
              <line x1="50" y1="6" x2="50" y2="94" stroke="rgba(139, 92, 246, 0.45)" strokeWidth="1.2" />
              <line x1="10" y1="29" x2="90" y2="29" stroke="rgba(244, 114, 168, 0.4)" strokeWidth="1.2" />
              <line x1="10" y1="71" x2="90" y2="71" stroke="rgba(244, 114, 168, 0.4)" strokeWidth="1.2" />
              {/* Inner Banded Crystal Rhombohedron */}
              <polygon
                points="50,22 75,37 75,63 50,78 25,63 25,37"
                stroke="#F472A8"
                strokeWidth="1.8"
                fill="rgba(244, 114, 168, 0.12)"
              />
              <line x1="25" y1="37" x2="75" y2="63" stroke="rgba(201, 209, 224, 0.35)" strokeWidth="1" />
              <line x1="25" y1="63" x2="75" y2="37" stroke="rgba(201, 209, 224, 0.35)" strokeWidth="1" />
              {/* Core Nucleus */}
              <circle cx="50" cy="50" r="4.5" fill="#8B5CF6" />
              <circle cx="50" cy="50" r="2" fill="#F472A8" />
            </svg>
          </div>
        </div>

        {/* Brand Tag & Headlines */}
        <div className="hero-badge">
          <span className="badge-pulse" />
          <span className="badge-text">COPERNICUS DATA SPACE ECOSYSTEM · SATELLITE ML PIPELINE</span>
        </div>

        <h1 className="hero-heading">
          See Beneath <span className="text-gradient-violet-rose">the Surface.</span>
        </h1>

        <p className="hero-subtitle">
          Transform real satellite observations into geological intelligence.
          Delineate prospective mineral exploration targets using Sentinel-2 multi-spectral ratios,
          SAR lineaments, and machine learning calibrated against verified ground truth.
        </p>

        {/* Action Buttons (48px touch targets) */}
        <div className="hero-actions">
          <button
            className="btn btn-primary btn-hero"
            onClick={onLaunchExploration}
            id="btn-launch-exploration"
          >
            <span className="btn-icon">⚡</span>
            <span>Launch Exploration</span>
            <span className="btn-arrow">→</span>
          </button>

          <button
            className="btn btn-secondary btn-hero btn-rose-border"
            onClick={onOpenIndiaAtlas}
            id="btn-open-india-atlas"
          >
            <span className="btn-icon">🇮🇳</span>
            <span>India Mineral Map</span>
          </button>

          <button
            className="btn btn-secondary btn-hero"
            onClick={onViewSatelliteData}
            id="btn-view-satellite-data"
          >
            <span className="btn-icon">🛰️</span>
            <span>View Satellite Data</span>
          </button>
        </div>

        {/* Space Technology & Mineralogy Telemetry Strip */}
        <div className="hero-telemetry-grid">
          <div className="telemetry-card">
            <div className="telemetry-label">PILOT STUDY AREA</div>
            <div className="telemetry-value">Keonjhar–Sundargarh, Odisha</div>
            <div className="telemetry-sub">Bonai-Keonjhar Belt · Jamda-Koira Valley</div>
          </div>
          <div className="telemetry-card">
            <div className="telemetry-label">INDIRECT INDICATORS</div>
            <div className="telemetry-value">Fe-Oxides · Clay/OH · Lineaments</div>
            <div className="telemetry-sub">B04/B02 · B11/B12 · Sentinel-1 SAR & DEM</div>
          </div>
          <div className="telemetry-card">
            <div className="telemetry-label">ML VALIDATION</div>
            <div className="telemetry-value">Spatial Block Cross-Validation</div>
            <div className="telemetry-sub">Positive-Unlabeled (PU) · Zero Spatial Leakage</div>
          </div>
          <div className="telemetry-card">
            <div className="telemetry-label">GROUND TRUTH BASE</div>
            <div className="telemetry-value">GSI Bhukosh & IBM Records</div>
            <div className="telemetry-sub">CSV / GeoJSON Schema Validated Uploads</div>
          </div>
        </div>
      </div>
    </section>
  )
}
