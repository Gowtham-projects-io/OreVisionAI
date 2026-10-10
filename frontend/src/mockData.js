/**
 * OreVision AI — Client-Side Geospatial & Geological Dataset
 * Used for GitHub Pages static deployment and offline / demo mode.
 * Contains verified GSI Bhukosh, IBM, and MOIL records for India's manganese belts.
 */

export const DEFAULT_MANGANESE_OCCURRENCES = [
  {
    id: "GSI-OD-01",
    name: "Barabil Mine (Jamda-Koira Valley)",
    district: "Kendujhar (Keonjhar)",
    state: "Odisha",
    latitude: 22.1245,
    longitude: 85.3852,
    geological_formation: "Iron Ore Group (IOG) Shales & Cherts",
    ore_type: "Lateritoid & stratiform pyrolusite-psilomelane",
    grade: "High grade (42-46% Mn)",
    status: "Active Major Mining Cluster",
    source: "GSI Bhukosh / IBM Mineral Year Book",
  },
  {
    id: "GSI-OD-02",
    name: "Joda West Manganese Mine",
    district: "Kendujhar (Keonjhar)",
    state: "Odisha",
    latitude: 22.0184,
    longitude: 85.4312,
    geological_formation: "Bonai-Keonjhar Belt, IOG",
    ore_type: "Wad, cryptomelane, pyrolusite in shale cavities",
    grade: "Medium-High grade (35-44% Mn)",
    status: "Active Tata Steel Mine",
    source: "GSI Bhukosh / IBM Mineral Year Book",
  },
  {
    id: "GSI-OD-03",
    name: "Koira Block Deposit",
    district: "Sundargarh",
    state: "Odisha",
    latitude: 21.9123,
    longitude: 85.2415,
    geological_formation: "Iron Ore Supergroup shales",
    ore_type: "Lateritic manganese pocket deposits",
    grade: "Medium grade (32-40% Mn)",
    status: "Active Quarry Complex",
    source: "GSI Bhukosh / IBM Mineral Year Book",
  },
  {
    id: "GSI-OD-04",
    name: "Kasia Manganese & Iron Deposit",
    district: "Kendujhar (Keonjhar)",
    state: "Odisha",
    latitude: 22.0520,
    longitude: 85.4110,
    geological_formation: "Bonai-Keonjhar Synclinorium shales",
    ore_type: "Pyrolusite lenses in manganiferous chert",
    grade: "Medium-High grade (36-43% Mn)",
    status: "Active Mining Lease",
    source: "GSI Bhukosh",
  },
  {
    id: "GSI-OD-05",
    name: "Gurda Manganese Deposit",
    district: "Kendujhar (Keonjhar)",
    state: "Odisha",
    latitude: 22.0315,
    longitude: 85.3412,
    geological_formation: "Upper Shale Formation, IOG",
    ore_type: "Bedded and podiform braunite-psilomelane",
    grade: "Medium grade (34-41% Mn)",
    status: "Active Open Pit",
    source: "GSI Bhukosh / IBM",
  },
  {
    id: "GSI-OD-06",
    name: "Kalimati Manganese Occurrence",
    district: "Kendujhar (Keonjhar)",
    state: "Odisha",
    latitude: 22.0830,
    longitude: 85.3740,
    geological_formation: "IOG Dolomitic Limestone & Chert contact",
    ore_type: "Supergene wad and cryptomelane",
    grade: "High grade (40-47% Mn)",
    status: "Historical Proven Deposit",
    source: "GSI Bhukosh",
  },
  {
    id: "GSI-OD-07",
    name: "Patmunda-Orahari Quarry Belt",
    district: "Sundargarh",
    state: "Odisha",
    latitude: 21.8740,
    longitude: 85.1950,
    geological_formation: "Bonai Granite-Greenstone Margin shales",
    ore_type: "Lateritoid manganite-pyrolusite",
    grade: "Low-Medium grade (29-37% Mn)",
    status: "Active Quarry",
    source: "GSI Bhukosh / IBM",
  },
  {
    id: "GSI-OD-08",
    name: "Siljora-Kalimati Mine (OMDC)",
    district: "Kendujhar (Keonjhar)",
    state: "Odisha",
    latitude: 22.1150,
    longitude: 85.3620,
    geological_formation: "Jamda-Koira Synform Shales",
    ore_type: "Bedded Mn-oxide with ferruginous intercalations",
    grade: "High grade (41-48% Mn)",
    status: "Active Lease",
    source: "GSI Bhukosh / OMDC",
  },
  {
    id: "GSI-OD-09",
    name: "Bolani South Margin Deposit",
    district: "Kendujhar (Keonjhar)",
    state: "Odisha",
    latitude: 22.1480,
    longitude: 85.3120,
    geological_formation: "IOG Banded Hematite Jasper transition zone",
    ore_type: "Pyrolusite in fracture-fill shear zones",
    grade: "Medium grade (33-39% Mn)",
    status: "Active Pit Margin",
    source: "GSI Bhukosh / SAIL",
  },
  {
    id: "GSI-OD-10",
    name: "Mahulsukha Manganese Prospect",
    district: "Sundargarh",
    state: "Odisha",
    latitude: 21.8420,
    longitude: 85.1620,
    geological_formation: "Bonai Folded Belt shales",
    ore_type: "Lateritic manganese nuggets in ferruginous soil",
    grade: "Low grade (28-34% Mn)",
    status: "Explored Prospect",
    source: "GSI Bhukosh",
  },
  {
    id: "GSI-MP-01",
    name: "Balaghat Mine (Bharweli)",
    district: "Balaghat",
    state: "Madhya Pradesh",
    latitude: 21.8712,
    longitude: 80.1834,
    geological_formation: "Mansar Formation, Sausar Group",
    ore_type: "Braunite, Pyrolusite, Psilomelane (Gondite type)",
    grade: "High grade (44-48% Mn)",
    status: "Active Major Underground Mine (MOIL)",
    source: "GSI Bhukosh / MOIL",
  },
  {
    id: "GSI-MP-02",
    name: "Tirodi Manganese Deposit",
    district: "Balaghat",
    state: "Madhya Pradesh",
    latitude: 21.6841,
    longitude: 79.7329,
    geological_formation: "Mansar Formation, Sausar Group",
    ore_type: "Braunite & Jacobsite in quartz-spessartine rocks",
    grade: "Medium-High grade (38-44% Mn)",
    status: "Active Open Cast Mine",
    source: "GSI Bhukosh / MOIL",
  },
]

export const INDIA_MANGANESE_STATES = [
  {
    state_id: "OD",
    state_name: "Odisha",
    national_share_pct: 44.0,
    estimated_reserves_mt: 195.4,
    dominant_belt: "Bonai-Keonjhar Belt & Jamda-Koira Valley",
    primary_host_rocks: "Iron Ore Group (IOG) Shales, Cherts, and Banded Hematite Jasper",
    key_operators: ["Tata Steel Mining", "OMDC", "SAIL", "Essel Mining", "Serajuddin & Co."],
    center: { lat: 21.85, lng: 85.25 },
    bbox: { west: 83.00, south: 18.40, east: 86.00, north: 22.40 },
    verified_occurrences_count: 10,
    districts: [
      {
        district_id: "OD-KJ",
        district_name: "Kendujhar (Keonjhar)",
        geological_formation: "Upper Shale Formation, Iron Ore Group (IOG)",
        ore_mineralogy: "Pyrolusite, Psilomelane, Cryptomelane, Wad",
        average_grade: "Medium to High Grade (36% - 48% Mn)",
        mining_status: "Active Major Cluster (60+ Leases)",
        reserve_mt: 115.0,
        center: { lat: 22.08, lng: 85.38 },
        bbox: { west: 85.10, south: 21.65, east: 85.65, north: 22.35 },
        key_mines: ["Barabil Mine", "Joda West", "Kasia", "Gurda", "Kalimati", "Bolani"],
        prospectivity_index: 0.88,
        copernicus_s2_tiles: ["45QUG", "45QUF", "45QVF"],
        verified_occurrences_count: 7,
      },
      {
        district_id: "OD-SG",
        district_name: "Sundargarh",
        geological_formation: "Bonai Granite-Greenstone Margin & Koira Synclinorium",
        ore_mineralogy: "Lateritoid Psilomelane, Pyrolusite, Manganite",
        average_grade: "Medium Grade (30% - 42% Mn)",
        mining_status: "Active Mining Area (35+ Leases)",
        reserve_mt: 62.5,
        center: { lat: 21.90, lng: 85.22 },
        bbox: { west: 84.70, south: 21.65, east: 85.35, north: 22.35 },
        key_mines: ["Koira Block", "Patmunda-Orahari", "Mahulsukha", "Taldih"],
        prospectivity_index: 0.82,
        copernicus_s2_tiles: ["45QUG", "45QUF"],
        verified_occurrences_count: 3,
      },
      {
        district_id: "OD-RG",
        district_name: "Rayagada",
        geological_formation: "Eastern Ghats Granulite Belt (Khondalite Suite)",
        ore_mineralogy: "Braunite, Cryptomelane, Pyrolusite lenses in khondalites",
        average_grade: "Medium Grade (32% - 40% Mn)",
        mining_status: "Semi-Active / Explored Prospects",
        reserve_mt: 12.4,
        center: { lat: 19.17, lng: 83.41 },
        bbox: { west: 83.10, south: 18.90, east: 83.75, north: 19.50 },
        key_mines: ["Kutinga Deposit", "Devajhola Prospect", "Nishikhal"],
        prospectivity_index: 0.74,
        copernicus_s2_tiles: ["44QKE", "44QKD"],
        verified_occurrences_count: 0,
      },
      {
        district_id: "OD-KP",
        district_name: "Koraput",
        geological_formation: "Eastern Ghats Mobile Belt metasediments",
        ore_mineralogy: "Supergene Wad, Pyrolusite, Psilomelane",
        average_grade: "Low to Medium Grade (28% - 36% Mn)",
        mining_status: "Explored Belt / GSI Reserves",
        reserve_mt: 5.5,
        center: { lat: 18.81, lng: 82.71 },
        bbox: { west: 82.30, south: 18.45, east: 83.10, north: 19.15 },
        key_mines: ["Podagada Prospect", "Ramagiri Valley"],
        prospectivity_index: 0.68,
        copernicus_s2_tiles: ["44QKD", "44QJC"],
        verified_occurrences_count: 0,
      },
    ],
  },
  {
    state_id: "MP",
    state_name: "Madhya Pradesh",
    national_share_pct: 27.0,
    estimated_reserves_mt: 120.2,
    dominant_belt: "Sausar Group / Balaghat Manganese Belt",
    primary_host_rocks: "Mansar Formation, Gondite (Quartz-Spessartine Metasediments)",
    key_operators: ["MOIL Limited (PSU)", "Private Leaseholders"],
    center: { lat: 21.85, lng: 80.15 },
    bbox: { west: 74.20, south: 21.40, east: 80.80, north: 23.20 },
    verified_occurrences_count: 2,
    districts: [
      {
        district_id: "MP-BG",
        district_name: "Balaghat",
        geological_formation: "Mansar Schist, Sausar Group",
        ore_mineralogy: "Braunite, Jacobsite, Pyrolusite, Cryptomelane (Gondite)",
        average_grade: "High Grade (42% - 49% Mn)",
        mining_status: "Asia's Premier Manganese Center (MOIL Core)",
        reserve_mt: 98.0,
        center: { lat: 21.87, lng: 80.18 },
        bbox: { west: 79.55, south: 21.45, east: 80.65, north: 22.25 },
        key_mines: ["Balaghat (Bharweli Mine)", "Tirodi Mine", "Ukwa Mine", "Ramrama", "Miragpur"],
        prospectivity_index: 0.92,
        copernicus_s2_tiles: ["44QME", "44QNE"],
        verified_occurrences_count: 2,
      },
      {
        district_id: "MP-CW",
        district_name: "Chhindwara",
        geological_formation: "Sausar Fold Belt Metasediments",
        ore_mineralogy: "Braunite, Holandite, Psilomelane in calc-silicate host",
        average_grade: "Medium Grade (34% - 42% Mn)",
        mining_status: "Active / Historic MOIL Mines",
        reserve_mt: 15.6,
        center: { lat: 21.65, lng: 78.95 },
        bbox: { west: 78.50, south: 21.40, east: 79.35, north: 22.05 },
        key_mines: ["Gowari Wadhona", "Kachhidhana", "Sitapar Deposit"],
        prospectivity_index: 0.77,
        copernicus_s2_tiles: ["44QLE", "44QLD"],
        verified_occurrences_count: 0,
      },
    ],
  },
  {
    state_id: "MH",
    state_name: "Maharashtra",
    national_share_pct: 15.0,
    estimated_reserves_mt: 66.8,
    dominant_belt: "Nagpur-Bhandara Sausar Belt",
    primary_host_rocks: "Mansar & Chorbaoli Formations, Sausar Supergroup",
    key_operators: ["MOIL Limited (PSU Headquarters)", "Maharashtra State Mining Corp"],
    center: { lat: 21.45, lng: 79.50 },
    bbox: { west: 78.80, south: 20.80, east: 80.20, north: 21.80 },
    verified_occurrences_count: 0,
    districts: [
      {
        district_id: "MH-BH",
        district_name: "Bhandara",
        geological_formation: "Sausar Supergroup, Mansar Stage",
        ore_mineralogy: "Electrolytic Pyrolusite, Cryptomelane, Braunite",
        average_grade: "High Grade Electrolytic Dioxide (44% - 52% MnO2)",
        mining_status: "Active Major Open Pit & Underground (MOIL)",
        reserve_mt: 38.4,
        center: { lat: 21.55, lng: 79.72 },
        bbox: { west: 79.50, south: 21.25, east: 80.05, north: 21.75 },
        key_mines: ["Dongri Buzurg Mine", "Chikla Mine", "Sitasaongi Mine"],
        prospectivity_index: 0.89,
        copernicus_s2_tiles: ["44QMD", "44QME"],
        verified_occurrences_count: 0,
      },
      {
        district_id: "MH-NG",
        district_name: "Nagpur",
        geological_formation: "Mansar Mica Schist, Sausar Group",
        ore_mineralogy: "Braunite, Rhodonite, Spessartine, Pyrolusite",
        average_grade: "Medium to High Grade (38% - 46% Mn)",
        mining_status: "Active MOIL Operations (Underground & Open Cast)",
        reserve_mt: 28.4,
        center: { lat: 21.40, lng: 79.28 },
        bbox: { west: 78.95, south: 21.15, east: 79.60, north: 21.65 },
        key_mines: ["Mansar Mine", "Kandri Mine", "Gumgaon Mine", "Beldongri"],
        prospectivity_index: 0.86,
        copernicus_s2_tiles: ["44QLD", "44QMD"],
        verified_occurrences_count: 0,
      },
    ],
  },
  {
    state_id: "KA",
    state_name: "Karnataka",
    national_share_pct: 8.0,
    estimated_reserves_mt: 35.6,
    dominant_belt: "Sandur Schist Belt (Dharwar Craton)",
    primary_host_rocks: "Deogiri Formation, Sandur Greenstone Belt, Banded Ferruginous Cherts",
    key_operators: ["Sandur Manganese & Iron Ores Ltd (SMIORE)", "Mysore Minerals Ltd"],
    center: { lat: 15.08, lng: 76.55 },
    bbox: { west: 74.80, south: 13.50, east: 77.20, north: 15.60 },
    verified_occurrences_count: 0,
    districts: [
      {
        district_id: "KA-BL",
        district_name: "Ballari (Sandur Valley)",
        geological_formation: "Deogiri Formation, Sandur Schist Belt",
        ore_mineralogy: "Ferruginous Manganese, Psilomelane, Manganite",
        average_grade: "Medium Grade (32% - 42% Mn, Low Phosphorus)",
        mining_status: "Active Mining District (SMIORE Core)",
        reserve_mt: 26.2,
        center: { lat: 15.08, lng: 76.55 },
        bbox: { west: 76.30, south: 14.90, east: 76.80, north: 15.35 },
        key_mines: ["Ramgad Mine", "Subbarayanahalli", "Kammathuru", "Vyasankere"],
        prospectivity_index: 0.84,
        copernicus_s2_tiles: ["43PEM", "43PEL"],
        verified_occurrences_count: 0,
      },
      {
        district_id: "KA-SM",
        district_name: "Shivamogga (Shimoga)",
        geological_formation: "Shimoga Schist Belt, Dharwar Supergroup",
        ore_mineralogy: "Lateritic manganese caps over phyllite",
        average_grade: "Low to Medium Grade (28% - 36% Mn)",
        mining_status: "Historic Active / State Leases",
        reserve_mt: 5.8,
        center: { lat: 14.15, lng: 75.55 },
        bbox: { west: 75.25, south: 13.80, east: 75.85, north: 14.45 },
        key_mines: ["Kumsi Deposit", "Shankargudda Prospect", "Channagiri"],
        prospectivity_index: 0.69,
        copernicus_s2_tiles: ["43PDL", "43PDK"],
        verified_occurrences_count: 0,
      },
    ],
  },
  {
    state_id: "AP",
    state_name: "Andhra Pradesh",
    national_share_pct: 3.0,
    estimated_reserves_mt: 13.4,
    dominant_belt: "Kodurite / Eastern Ghats Granulite Belt",
    primary_host_rocks: "Khondalite Suite & Kodurite Rock Series (Apatite-Spandite-Orthoclase)",
    key_operators: ["Andhra Pradesh Mineral Development Corp (APMDC)", "Local Leaseholders"],
    center: { lat: 18.30, lng: 83.55 },
    bbox: { west: 83.00, south: 18.00, east: 84.70, north: 19.10 },
    verified_occurrences_count: 0,
    districts: [
      {
        district_id: "AP-VZ",
        district_name: "Vizianagaram",
        geological_formation: "Kodurite Series, Eastern Ghats Mobile Belt",
        ore_mineralogy: "Psilomelane, Pyrolusite, Braunite (Kodurite altered)",
        average_grade: "Medium Grade (30% - 38% Mn)",
        mining_status: "Historic Famous Type Locality (Fermor 1909)",
        reserve_mt: 9.2,
        center: { lat: 18.28, lng: 83.56 },
        bbox: { west: 83.25, south: 18.05, east: 83.85, north: 18.60 },
        key_mines: ["Garbham Deposit", "Kodur Mine", "Devada", "Chipurupalle"],
        prospectivity_index: 0.75,
        copernicus_s2_tiles: ["44QKE", "44QLE"],
        verified_occurrences_count: 0,
      },
    ],
  },
]

export const INDIA_MINERAL_SUMMARY = {
  country: "India",
  mineral: "Manganese Ore (Mn)",
  total_estimated_reserves_mt: 444.1,
  total_producing_states: 8,
  total_priority_districts: 18,
  verified_gsi_occurrences_count: 12,
  national_production_rank: "5th Globally (after South Africa, Gabon, Australia, China)",
  key_geological_belts: [
    "Bonai-Keonjhar Belt & Jamda-Koira Valley (Odisha)",
    "Sausar Group Gondite Belt (Madhya Pradesh & Maharashtra)",
    "Sandur Schist Belt (Karnataka)",
    "Eastern Ghats Khondalite-Kodurite Belt (Andhra Pradesh & Odisha)",
    "Singhbhum Iron Ore Craton (Jharkhand)",
    "Aravalli & Champaner Supergroup (Rajasthan & Gujarat)",
  ],
  state_shares: INDIA_MANGANESE_STATES.map(s => ({
    state: s.state_name,
    state_id: s.state_id,
    share_pct: s.national_share_pct,
    reserves_mt: s.estimated_reserves_mt,
  })),
}

/**
 * Creates high-fidelity synthetic heatmaps and raster PNGs in the browser using HTML5 Canvas.
 * Returns raw base64 string (without data:image/png;base64, prefix).
 */
export function generateProceduralHeatmapBase64(type = 'prospectivity', width = 256, height = 256) {
  if (typeof document === 'undefined') return ''

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  if (type === 'prospectivity') {
    // Background transparent/dark slate
    ctx.clearRect(0, 0, width, height)

    // Draw hotspot clusters simulating mineralized shear zones and alteration halos
    const centers = [
      { x: width * 0.52, y: height * 0.42, r: width * 0.32, maxAlpha: 0.85 },
      { x: width * 0.38, y: height * 0.65, r: width * 0.25, maxAlpha: 0.75 },
      { x: width * 0.72, y: height * 0.32, r: width * 0.20, maxAlpha: 0.80 },
      { x: width * 0.22, y: height * 0.28, r: width * 0.18, maxAlpha: 0.60 },
    ]

    centers.forEach(c => {
      const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r)
      // Prospectivity Palette: Deep Violet -> Rose -> Copper Gold -> Electric Cyan core
      grad.addColorStop(0.0, `rgba(244, 114, 182, ${c.maxAlpha})`)
      grad.addColorStop(0.35, `rgba(139, 92, 246, ${c.maxAlpha * 0.75})`)
      grad.addColorStop(0.65, `rgba(217, 119, 6, ${c.maxAlpha * 0.45})`)
      grad.addColorStop(1.0, 'rgba(15, 23, 42, 0)')

      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
      ctx.fill()
    })

    // Add high-confidence core spikes
    centers.forEach(c => {
      const core = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r * 0.35)
      core.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
      core.addColorStop(0.4, 'rgba(244, 63, 94, 0.90)')
      core.addColorStop(1, 'rgba(244, 63, 94, 0)')
      ctx.fillStyle = core
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.r * 0.35, 0, Math.PI * 2)
      ctx.fill()
    })
  } else if (type === 'uncertainty') {
    ctx.clearRect(0, 0, width, height)
    // Amber / Crimson glow for uncertainty variance
    const uCenters = [
      { x: width * 0.65, y: height * 0.55, r: width * 0.28 },
      { x: width * 0.30, y: height * 0.40, r: width * 0.22 },
    ]
    uCenters.forEach(c => {
      const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r)
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.75)')
      grad.addColorStop(0.5, 'rgba(239, 68, 68, 0.45)')
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
      ctx.fill()
    })
  } else if (type === 'change') {
    // Change detection difference heatmap (Excavation expansion & dump growth)
    ctx.clearRect(0, 0, width, height)
    const pits = [
      { x: width * 0.48, y: height * 0.50, r: width * 0.28, color: 'rgba(239, 68, 68, 0.85)' },
      { x: width * 0.70, y: height * 0.38, r: width * 0.18, color: 'rgba(245, 158, 11, 0.75)' },
      { x: width * 0.35, y: height * 0.68, r: width * 0.15, color: 'rgba(16, 185, 129, 0.70)' },
    ]
    pits.forEach(p => {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r)
      g.addColorStop(0, p.color)
      g.addColorStop(0.6, p.color.replace('0.85', '0.4').replace('0.75', '0.3').replace('0.70', '0.3'))
      g.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()
    })
  } else {
    // Sentinel-2 satellite simulated composite
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, width, height)

    // Terrain bands
    for (let i = 0; i < 20; i++) {
      const x = (i * 37) % width
      const y = (i * 43) % height
      const r = 30 + (i * 7) % 50
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, i % 2 === 0 ? 'rgba(74, 93, 110, 0.6)' : 'rgba(124, 58, 237, 0.4)')
      g.addColorStop(1, 'rgba(30, 41, 59, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const dataUrl = canvas.toDataURL('image/png')
  return dataUrl.replace(/^data:image\/png;base64,/, '')
}
