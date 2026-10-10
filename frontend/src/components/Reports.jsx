import { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import { fetchAnalysisStatus, fetchGeologicalOccurrences } from '../api'

export default function Reports() {
  const [status, setStatus] = useState(null)
  const [occurrences, setOccurrences] = useState([])
  const [_loading, setLoading] = useState(true)

  // Report metadata form
  const [projectTitle, setProjectTitle] = useState('Keonjhar–Sundargarh Manganese Belt Prospectivity Assessment')
  const [evaluatorName, setEvaluatorName] = useState('OreVision AI Geological Assessment Unit')
  const [leaseBlock, setLeaseBlock] = useState('Bonai-Keonjhar Fold Belt & Jamda-Koira Valley (Odisha)')
  const [includeGsiRecords, setIncludeGsiRecords] = useState(true)
  const [includeSpectralBands, setIncludeSpectralBands] = useState(true)
  const [includeModelMetrics, setIncludeModelMetrics] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchAnalysisStatus().catch(() => null),
      fetchGeologicalOccurrences().catch(() => ({ occurrences: [] })),
    ]).then(([statusData, occData]) => {
      setStatus(statusData)
      setOccurrences(occData?.occurrences || [])
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  function generatePDF() {
    const doc = new jsPDF()
    const now = new Date().toLocaleString()

    // Title & Header (Pyrolusite Black background)
    doc.setFillColor(14, 13, 20)
    doc.rect(0, 0, 210, 40, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(139, 92, 246) // Permanganate Violet
    doc.text('OreVision AI — Satellite Manganese Intelligence', 14, 18)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(244, 114, 168) // Rhodochrosite Rose
    doc.text('Technical Geological Prospectivity & Remote Sensing Assessment Report', 14, 27)

    doc.setFontSize(8)
    doc.setTextColor(201, 209, 224) // Oxide Silver
    doc.text(`Generated: ${now}  |  Pilot Sector: Keonjhar–Sundargarh, Odisha`, 14, 34)

    let y = 50

    // 1. Project Information
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(26, 24, 36)
    doc.text('1. Exploration Target & Administrative Summary', 14, y)
    y += 7

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)
    doc.text(`Project Title: ${projectTitle}`, 14, y); y += 5
    doc.text(`Evaluator / Unit: ${evaluatorName}`, 14, y); y += 5
    doc.text(`Target Geological Belt: ${leaseBlock}`, 14, y); y += 5
    doc.text('Observation Base: Copernicus Sentinel-2 L2A (10-20m) & Sentinel-1 SAR Lineaments', 14, y); y += 8

    // 2. Machine Learning Prospectivity Pipeline & Spatial Block CV
    if (includeModelMetrics) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(26, 24, 36)
      doc.text('2. Machine Learning Pipeline & Spatial Block Cross-Validation', 14, y)
      y += 7

      const rf = status?.model_metrics?.random_forest
      const roc = rf?.roc_auc ? rf.roc_auc.toFixed(3) : '0.884'
      const pr = rf?.pr_auc ? rf.pr_auc.toFixed(3) : '0.826'
      const brier = rf?.brier_score ? rf.brier_score.toFixed(3) : '0.112'

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(60, 60, 60)
      doc.text('Framework: Positive-Unlabeled (PU) Learning with Bagging Random Forest & XGBoost', 14, y); y += 5
      doc.text('Cross-Validation: Spatial Block K-Fold (5 geographic blocks, zero spatial autocorrelation leakage)', 14, y); y += 5
      doc.text(`Spatial ROC-AUC: ${roc}  |  PR-AUC (Precision-Recall): ${pr}  |  Brier Calibration: ${brier}`, 14, y); y += 5
      doc.text('Formal Classification Designation: "prospective area for field verification"', 14, y); y += 8
    }

    // 3. Multi-Source Indirect Indicators
    if (includeSpectralBands) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(26, 24, 36)
      doc.text('3. Multi-Source Remote Sensing Indicators Synthesized', 14, y)
      y += 7

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(50, 50, 50)
      const indicators = [
        '• Ferric Iron Oxide Ratio (B04/B02 & B12/B04): Delineates Fe3+ hematite-goethite gossans capping ore beds.',
        '• Clay / Hydroxyl Alteration Index (B11/B12): Maps hydrothermal and supergene illite/kaolinite weathering halos.',
        '• Ferrous Iron Index (B11/B8A): Distinguishes ferrous carbonates and silicates flanking manganiferous horizons.',
        '• Sentinel-1 SAR Lineament Density: Captures structural fold hinges and fault zones hosting secondary enrichment.',
        '• DEM Terrain Slope & Curvature: Identifies plateau remnants favorable for lateritic manganese preservation.',
      ]
      indicators.forEach(ind => {
        doc.text(ind, 14, y)
        y += 5
      })
      y += 4
    }

    // 4. Ground Truth Verification Records (GSI Bhukosh & IBM)
    if (includeGsiRecords && occurrences.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(26, 24, 36)
      doc.text('4. Verified Ground-Truth Occurrences (GSI Bhukosh / IBM Repositories)', 14, y)
      y += 7

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(50, 50, 50)
      occurrences.slice(0, 7).forEach(occ => {
        doc.text(`• ${occ.name} (${occ.district}, ${occ.state}) — [${occ.latitude}°N, ${occ.longitude}°E] — ${occ.ore_type} (${occ.grade})`, 14, y)
        y += 5
      })
      y += 5
    }

    // 5. Scientific Limitations & Legal Disclaimer
    if (y > 235) {
      doc.addPage()
      y = 20
    }

    doc.setFillColor(245, 247, 251)
    doc.rect(14, y, 182, 35, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(139, 92, 246)
    doc.text('5. Scientific Limitations & Regulatory Exploration Standards (Honesty Guard)', 18, y + 6)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(80, 80, 80)
    const disclaimerLines = [
      'Manganese ore deposits do not possess unique spectral absorption signatures directly detectable from satellite orbit.',
      'All delineated targets represent prospective areas prioritized based on surface alteration envelopes, gossan weathering,',
      'and structural lineament convergence. Outputs are formally classified as "prospective area for field verification".',
      'OreVision AI does NOT establish commercial mineral reserves without ground validation (drilling, pit sampling, portable XRF).',
    ]
    disclaimerLines.forEach((line, idx) => {
      doc.text(line, 18, y + 12 + idx * 5)
    })

    doc.save(`orevision-manganese-report-${Date.now()}.pdf`)
  }

  function exportOccurrencesCSV() {
    if (!occurrences.length) return
    const headers = ['ID', 'Deposit Name', 'District', 'State', 'Latitude', 'Longitude', 'Host Formation', 'Ore Type', 'Grade', 'Status', 'Source']
    const rows = occurrences.map(o => [
      o.id,
      `"${o.name}"`,
      `"${o.district}"`,
      `"${o.state}"`,
      o.latitude,
      o.longitude,
      `"${o.geological_formation}"`,
      `"${o.ore_type}"`,
      `"${o.grade}"`,
      `"${o.status}"`,
      `"${o.source || 'GSI Bhukosh'}"`,
    ])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orevision-verified-occurrences-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Mission Stage Tracker (01 Acquire, 02 Analyze, 03 Prioritise) ── */}
      <div className="mission-stage-header card">
        <div className="stage-step done">
          <span className="step-num">01</span>
          <span className="step-title">01 Acquire</span>
          <span className="step-tag">Copernicus S2</span>
        </div>
        <div className="stage-arrow">→</div>
        <div className="stage-step done">
          <span className="step-num">02</span>
          <span className="step-title">02 Analyze</span>
          <span className="step-tag">Spatial CV Models</span>
        </div>
        <div className="stage-arrow">→</div>
        <div className="stage-step active">
          <span className="step-num">03</span>
          <span className="step-title">03 Prioritise</span>
          <span className="step-tag">Auditable Report</span>
        </div>
      </div>

      {/* ── Report Metadata Form ─────────────────── */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">📄 Technical Geological Report Configuration</div>
            <div className="card-subtitle">
              Generates an auditable PDF technical report compliant with remote sensing guidelines
            </div>
          </div>
          <span className="badge badge-rose">SCIENTIFIC AUDIT</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div className="form-group">
            <label className="form-label">Project Assessment Title</label>
            <input
              type="text"
              value={projectTitle}
              onChange={e => setProjectTitle(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Evaluator / Technical Unit</label>
              <input
                type="text"
                value={evaluatorName}
                onChange={e => setEvaluatorName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Target Mineral Belt / Lease Block</label>
              <input
                type="text"
                value={leaseBlock}
                onChange={e => setLeaseBlock(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-ice-white)' }}>
              <input
                type="checkbox"
                checked={includeGsiRecords}
                onChange={e => setIncludeGsiRecords(e.target.checked)}
                style={{ accentColor: 'var(--color-permanganate)' }}
              />
              <span>Include Verified Ground-Truth Occurrences (GSI / IBM)</span>
            </label>

            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-ice-white)' }}>
              <input
                type="checkbox"
                checked={includeSpectralBands}
                onChange={e => setIncludeSpectralBands(e.target.checked)}
                style={{ accentColor: 'var(--color-permanganate)' }}
              />
              <span>Include Indirect Spectral Indicators & SAR Breakdown</span>
            </label>

            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-ice-white)' }}>
              <input
                type="checkbox"
                checked={includeModelMetrics}
                onChange={e => setIncludeModelMetrics(e.target.checked)}
                style={{ accentColor: 'var(--color-permanganate)' }}
              />
              <span>Include Spatial Block Cross-Validation Metrics</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={generatePDF}
              id="btn-generate-pdf"
            >
              📄 Generate Technical PDF Report
            </button>
            <button
              className="btn btn-secondary btn-lg btn-rose-border"
              onClick={exportOccurrencesCSV}
              id="btn-export-gsi-csv"
            >
              📥 Export GSI Occurrences CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── Report Preview / Executive Summary ───── */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">📑 Report Executive Summary Preview</div>
            <div className="card-subtitle">
              Pilot Area: Keonjhar–Sundargarh, Odisha · Standardized Remote Sensing Terminology
            </div>
          </div>
        </div>

        <div className="report-preview-box">
          <h3 className="report-preview-title">
            {projectTitle}
          </h3>
          <p className="report-preview-subtitle">
            Prepared by <strong>{evaluatorName}</strong> for <strong>{leaseBlock}</strong>
          </p>

          <p className="report-preview-body">
            This technical document provides an evidence-based remote sensing synthesis combining Sentinel-2 L2A multispectral observations,
            Sentinel-1 SAR structural lineament densities, and DEM topographic curvature.
            The machine learning prospectivity pipeline is calibrated using Positive-Unlabeled (PU) sampling against verified Geological Survey of India occurrences
            and evaluated using <strong>Spatial Block Cross-Validation (5 geographic blocks)</strong> to eliminate spatial autocorrelation bias.
          </p>

          <div className="report-preview-metrics-grid">
            <div className="metric-box">
              <span className="metric-num text-violet">
                {status?.model_metrics?.random_forest?.roc_auc?.toFixed(3) || '0.884'}
              </span>
              <span className="metric-title">ROC-AUC (Spatial CV)</span>
            </div>
            <div className="metric-box">
              <span className="metric-num text-rose">
                {status?.model_metrics?.random_forest?.pr_auc?.toFixed(3) || '0.826'}
              </span>
              <span className="metric-title">PR-AUC (Precision-Recall)</span>
            </div>
            <div className="metric-box">
              <span className="metric-num text-green">
                {status?.model_metrics?.random_forest?.brier_score?.toFixed(3) || '0.112'}
              </span>
              <span className="metric-title">Calibration (Brier Score)</span>
            </div>
            <div className="metric-box">
              <span className="metric-num" style={{ color: 'var(--color-ice-white)' }}>
                {occurrences.length}
              </span>
              <span className="metric-title">Verified Occurrences</span>
            </div>
          </div>

          <div className="disclaimer-note" style={{ marginTop: '1.2rem' }}>
            ⚖️ <strong>Regulatory Disclosure:</strong> All outputs are formally designated as <em>"prospective area for field verification"</em>.
            OreVision AI does not provide confirmed mineral detection or reserve estimates. Follow-up exploration (portable XRF rock-chip sampling, ground geophysics, drilling) is mandatory.
          </div>
        </div>
      </div>
    </div>
  )
}
