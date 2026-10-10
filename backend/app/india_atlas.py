"""
OreVision AI — India Mineral Intelligence Atlas
Provides structured geological, administrative, and live occurrence data
for all major manganese-bearing states and districts across India.
Sources: Geological Survey of India (GSI Bhukosh), Indian Bureau of Mines (IBM), MOIL records.
"""

from typing import Any, Optional
from app.analysis import KNOWN_MANGANESE_OCCURRENCES

# ── Major Manganese Belts & State/District Database ──────────
INDIA_MANGANESE_STATES = [
    {
        "state_id": "OD",
        "state_name": "Odisha",
        "national_share_pct": 44.0,
        "estimated_reserves_mt": 195.4,
        "dominant_belt": "Bonai-Keonjhar Belt & Jamda-Koira Valley",
        "primary_host_rocks": "Iron Ore Group (IOG) Shales, Cherts, and Banded Hematite Jasper",
        "key_operators": ["Tata Steel Mining", "OMDC", "SAIL", "Essel Mining", "Serajuddin & Co."],
        "center": {"lat": 21.85, "lng": 85.25},
        "bbox": {"west": 83.00, "south": 18.40, "east": 86.00, "north": 22.40},
        "districts": [
            {
                "district_id": "OD-KJ",
                "district_name": "Kendujhar (Keonjhar)",
                "geological_formation": "Upper Shale Formation, Iron Ore Group (IOG)",
                "ore_mineralogy": "Pyrolusite, Psilomelane, Cryptomelane, Wad",
                "average_grade": "Medium to High Grade (36% - 48% Mn)",
                "mining_status": "Active Major Cluster (60+ Leases)",
                "reserve_mt": 115.0,
                "center": {"lat": 22.08, "lng": 85.38},
                "bbox": {"west": 85.10, "south": 21.65, "east": 85.65, "north": 22.35},
                "key_mines": ["Barabil Mine", "Joda West", "Kasia", "Gurda", "Kalimati", "Bolani"],
                "prospectivity_index": 0.88,
                "copernicus_s2_tiles": ["45QUG", "45QUF", "45QVF"],
            },
            {
                "district_id": "OD-SG",
                "district_name": "Sundargarh",
                "geological_formation": "Bonai Granite-Greenstone Margin & Koira Synclinorium",
                "ore_mineralogy": "Lateritoid Psilomelane, Pyrolusite, Manganite",
                "average_grade": "Medium Grade (30% - 42% Mn)",
                "mining_status": "Active Mining Area (35+ Leases)",
                "reserve_mt": 62.5,
                "center": {"lat": 21.90, "lng": 85.22},
                "bbox": {"west": 84.70, "south": 21.65, "east": 85.35, "north": 22.35},
                "key_mines": ["Koira Block", "Patmunda-Orahari", "Mahulsukha", "Taldih"],
                "prospectivity_index": 0.82,
                "copernicus_s2_tiles": ["45QUG", "45QUF"],
            },
            {
                "district_id": "OD-RG",
                "district_name": "Rayagada",
                "geological_formation": "Eastern Ghats Granulite Belt (Khondalite Suite)",
                "ore_mineralogy": "Braunite, Cryptomelane, Pyrolusite lenses in khondalites",
                "average_grade": "Medium Grade (32% - 40% Mn)",
                "mining_status": "Semi-Active / Explored Prospects",
                "reserve_mt": 12.4,
                "center": {"lat": 19.17, "lng": 83.41},
                "bbox": {"west": 83.10, "south": 18.90, "east": 83.75, "north": 19.50},
                "key_mines": ["Kutinga Deposit", "Devajhola Prospect", "Nishikhal"],
                "prospectivity_index": 0.74,
                "copernicus_s2_tiles": ["44QKE", "44QKD"],
            },
            {
                "district_id": "OD-KP",
                "district_name": "Koraput",
                "geological_formation": "Eastern Ghats Mobile Belt metasediments",
                "ore_mineralogy": "Supergene Wad, Pyrolusite, Psilomelane",
                "average_grade": "Low to Medium Grade (28% - 36% Mn)",
                "mining_status": "Explored Belt / GSI Reserves",
                "reserve_mt": 5.5,
                "center": {"lat": 18.81, "lng": 82.71},
                "bbox": {"west": 82.30, "south": 18.45, "east": 83.10, "north": 19.15},
                "key_mines": ["Podagada Prospect", "Ramagiri Valley"],
                "prospectivity_index": 0.68,
                "copernicus_s2_tiles": ["44QKD", "44QJC"],
            },
        ],
    },
    {
        "state_id": "MP",
        "state_name": "Madhya Pradesh",
        "national_share_pct": 27.0,
        "estimated_reserves_mt": 120.2,
        "dominant_belt": "Sausar Group / Balaghat Manganese Belt",
        "primary_host_rocks": "Mansar Formation, Gondite (Quartz-Spessartine Metasediments)",
        "key_operators": ["MOIL Limited (PSU)", "Private Leaseholders"],
        "center": {"lat": 21.85, "lng": 80.15},
        "bbox": {"west": 74.20, "south": 21.40, "east": 80.80, "north": 23.20},
        "districts": [
            {
                "district_id": "MP-BG",
                "district_name": "Balaghat",
                "geological_formation": "Mansar Schist, Sausar Group",
                "ore_mineralogy": "Braunite, Jacobsite, Pyrolusite, Cryptomelane (Gondite)",
                "average_grade": "High Grade (42% - 49% Mn)",
                "mining_status": "Asia's Premier Manganese Center (MOIL Core)",
                "reserve_mt": 98.0,
                "center": {"lat": 21.87, "lng": 80.18},
                "bbox": {"west": 79.55, "south": 21.45, "east": 80.65, "north": 22.25},
                "key_mines": ["Balaghat (Bharweli Mine)", "Tirodi Mine", "Ukwa Mine", "Ramrama", "Miragpur"],
                "prospectivity_index": 0.92,
                "copernicus_s2_tiles": ["44QME", "44QNE"],
            },
            {
                "district_id": "MP-CW",
                "district_name": "Chhindwara",
                "geological_formation": "Sausar Fold Belt Metasediments",
                "ore_mineralogy": "Braunite, Holandite, Psilomelane in calc-silicate host",
                "average_grade": "Medium Grade (34% - 42% Mn)",
                "mining_status": "Active / Historic MOIL Mines",
                "reserve_mt": 15.6,
                "center": {"lat": 21.65, "lng": 78.95},
                "bbox": {"west": 78.50, "south": 21.40, "east": 79.35, "north": 22.05},
                "key_mines": ["Gowari Wadhona", "Kachhidhana", "Sitapar Deposit"],
                "prospectivity_index": 0.77,
                "copernicus_s2_tiles": ["44QLE", "44QLD"],
            },
            {
                "district_id": "MP-JB",
                "district_name": "Jhabua",
                "geological_formation": "Aravalli Supergroup quartzite-phyllite intercalations",
                "ore_mineralogy": "Braunite, Bixbyite, Pyrolusite in gondite rocks",
                "average_grade": "Medium Grade (32% - 40% Mn)",
                "mining_status": "Active & Historic Pit Cluster",
                "reserve_mt": 6.6,
                "center": {"lat": 22.76, "lng": 74.59},
                "bbox": {"west": 74.25, "south": 22.50, "east": 74.85, "north": 23.05},
                "key_mines": ["Kajlidongri Deposit", "Amliamal Prospect", "Tumdia"],
                "prospectivity_index": 0.71,
                "copernicus_s2_tiles": ["43QGF", "43QGE"],
            },
        ],
    },
    {
        "state_id": "MH",
        "state_name": "Maharashtra",
        "national_share_pct": 15.0,
        "estimated_reserves_mt": 66.8,
        "dominant_belt": "Nagpur-Bhandara Sausar Belt",
        "primary_host_rocks": "Mansar & Chorbaoli Formations, Sausar Supergroup",
        "key_operators": ["MOIL Limited (PSU Headquarters)", "Maharashtra State Mining Corp"],
        "center": {"lat": 21.45, "lng": 79.50},
        "bbox": {"west": 78.80, "south": 20.80, "east": 80.20, "north": 21.80},
        "districts": [
            {
                "district_id": "MH-BH",
                "district_name": "Bhandara",
                "geological_formation": "Sausar Supergroup, Mansar Stage",
                "ore_mineralogy": "Electrolytic Pyrolusite, Cryptomelane, Braunite",
                "average_grade": "High Grade Electrolytic Dioxide (44% - 52% MnO2)",
                "mining_status": "Active Major Open Pit & Underground (MOIL)",
                "reserve_mt": 38.4,
                "center": {"lat": 21.55, "lng": 79.72},
                "bbox": {"west": 79.50, "south": 21.25, "east": 80.05, "north": 21.75},
                "key_mines": ["Dongri Buzurg Mine", "Chikla Mine", "Sitasaongi Mine"],
                "prospectivity_index": 0.89,
                "copernicus_s2_tiles": ["44QMD", "44QME"],
            },
            {
                "district_id": "MH-NG",
                "district_name": "Nagpur",
                "geological_formation": "Mansar Mica Schist, Sausar Group",
                "ore_mineralogy": "Braunite, Rhodonite, Spessartine, Pyrolusite",
                "average_grade": "Medium to High Grade (38% - 46% Mn)",
                "mining_status": "Active MOIL Operations (Underground & Open Cast)",
                "reserve_mt": 28.4,
                "center": {"lat": 21.40, "lng": 79.28},
                "bbox": {"west": 78.95, "south": 21.15, "east": 79.60, "north": 21.65},
                "key_mines": ["Mansar Mine", "Kandri Mine", "Gumgaon Mine", "Beldongri"],
                "prospectivity_index": 0.86,
                "copernicus_s2_tiles": ["44QLD", "44QMD"],
            },
        ],
    },
    {
        "state_id": "KA",
        "state_name": "Karnataka",
        "national_share_pct": 8.0,
        "estimated_reserves_mt": 35.6,
        "dominant_belt": "Sandur Schist Belt (Dharwar Craton)",
        "primary_host_rocks": "Deogiri Formation, Sandur Greenstone Belt, Banded Ferruginous Cherts",
        "key_operators": ["Sandur Manganese & Iron Ores Ltd (SMIORE)", "Mysore Minerals Ltd"],
        "center": {"lat": 15.08, "lng": 76.55},
        "bbox": {"west": 74.80, "south": 13.50, "east": 77.20, "north": 15.60},
        "districts": [
            {
                "district_id": "KA-BL",
                "district_name": "Ballari (Sandur Valley)",
                "geological_formation": "Deogiri Formation, Sandur Schist Belt",
                "ore_mineralogy": "Ferruginous Manganese, Psilomelane, Manganite",
                "average_grade": "Medium Grade (32% - 42% Mn, Low Phosphorus)",
                "mining_status": "Active Mining District (SMIORE Core)",
                "reserve_mt": 26.2,
                "center": {"lat": 15.08, "lng": 76.55},
                "bbox": {"west": 76.30, "south": 14.90, "east": 76.80, "north": 15.35},
                "key_mines": ["Ramgad Mine", "Subbarayanahalli", "Kammathuru", "Vyasankere"],
                "prospectivity_index": 0.84,
                "copernicus_s2_tiles": ["43PEM", "43PEL"],
            },
            {
                "district_id": "KA-SM",
                "district_name": "Shivamogga (Shimoga)",
                "geological_formation": "Shimoga Schist Belt, Dharwar Supergroup",
                "ore_mineralogy": "Lateritic manganese caps over phyllite",
                "average_grade": "Low to Medium Grade (28% - 36% Mn)",
                "mining_status": "Historic Active / State Leases",
                "reserve_mt": 5.8,
                "center": {"lat": 14.15, "lng": 75.55},
                "bbox": {"west": 75.25, "south": 13.80, "east": 75.85, "north": 14.45},
                "key_mines": ["Kumsi Deposit", "Shankargudda Prospect", "Channagiri"],
                "prospectivity_index": 0.69,
                "copernicus_s2_tiles": ["43PDL", "43PDK"],
            },
            {
                "district_id": "KA-CD",
                "district_name": "Chitradurga",
                "geological_formation": "Ingaldhal Formation, Chitradurga Schist Belt",
                "ore_mineralogy": "Podiform braunite and wad in ferruginous chert",
                "average_grade": "Low to Medium Grade (26% - 34% Mn)",
                "mining_status": "Explored Belt / Small Quarries",
                "reserve_mt": 3.6,
                "center": {"lat": 14.22, "lng": 76.40},
                "bbox": {"west": 76.05, "south": 13.95, "east": 76.65, "north": 14.55},
                "key_mines": ["Sadarhalli Prospect", "Shivagange Deposit"],
                "prospectivity_index": 0.65,
                "copernicus_s2_tiles": ["43PEL", "43PEK"],
            },
        ],
    },
    {
        "state_id": "AP",
        "state_name": "Andhra Pradesh",
        "national_share_pct": 3.0,
        "estimated_reserves_mt": 13.4,
        "dominant_belt": "Kodurite / Eastern Ghats Granulite Belt",
        "primary_host_rocks": "Khondalite Suite & Kodurite Rock Series (Apatite-Spandite-Orthoclase)",
        "key_operators": ["Andhra Pradesh Mineral Development Corp (APMDC)", "Local Leaseholders"],
        "center": {"lat": 18.30, "lng": 83.55},
        "bbox": {"west": 83.00, "south": 18.00, "east": 84.70, "north": 19.10},
        "districts": [
            {
                "district_id": "AP-VZ",
                "district_name": "Vizianagaram",
                "geological_formation": "Kodurite Series, Eastern Ghats Mobile Belt",
                "ore_mineralogy": "Psilomelane, Pyrolusite, Braunite (Kodurite altered)",
                "average_grade": "Medium Grade (30% - 38% Mn)",
                "mining_status": "Historic Famous Type Locality (Fermor 1909)",
                "reserve_mt": 9.2,
                "center": {"lat": 18.28, "lng": 83.56},
                "bbox": {"west": 83.25, "south": 18.05, "east": 83.85, "north": 18.60},
                "key_mines": ["Garbham Deposit", "Kodur Mine", "Devada", "Chipurupalle"],
                "prospectivity_index": 0.75,
                "copernicus_s2_tiles": ["44QKE", "44QLE"],
            },
            {
                "district_id": "AP-SK",
                "district_name": "Srikakulam",
                "geological_formation": "Khondalite-Charnockite Contact Zone",
                "ore_mineralogy": "Supergene wad and pyrolusite coatings",
                "average_grade": "Low to Medium Grade (27% - 35% Mn)",
                "mining_status": "Active Small Scale & Explored",
                "reserve_mt": 4.2,
                "center": {"lat": 18.75, "lng": 84.35},
                "bbox": {"west": 84.05, "south": 18.45, "east": 84.65, "north": 19.05},
                "key_mines": ["Mandasa Deposit", "Sompeta Prospect"],
                "prospectivity_index": 0.67,
                "copernicus_s2_tiles": ["44QLF", "44QLE"],
            },
        ],
    },
    {
        "state_id": "JH",
        "state_name": "Jharkhand",
        "national_share_pct": 2.0,
        "estimated_reserves_mt": 8.9,
        "dominant_belt": "Singhbhum Iron Ore Craton",
        "primary_host_rocks": "Iron Ore Group (IOG) Shales & Jasper",
        "key_operators": ["SAIL", "Tata Steel", "State Leases"],
        "center": {"lat": 22.25, "lng": 85.55},
        "bbox": {"west": 85.10, "south": 21.95, "east": 86.00, "north": 22.80},
        "districts": [
            {
                "district_id": "JH-WS",
                "district_name": "West Singhbhum",
                "geological_formation": "Singhbhum Iron Ore Group (IOG)",
                "ore_mineralogy": "Stratiform Pyrolusite, Psilomelane in ferruginous shales",
                "average_grade": "Medium Grade (33% - 42% Mn)",
                "mining_status": "Active Iron-Manganese Complex",
                "reserve_mt": 8.9,
                "center": {"lat": 22.25, "lng": 85.55},
                "bbox": {"west": 85.25, "south": 22.00, "east": 85.85, "north": 22.65},
                "key_mines": ["Gua South Deposit", "Noamundi Margin", "Chaibasa-Jamda"],
                "prospectivity_index": 0.81,
                "copernicus_s2_tiles": ["45QUG", "45QVG"],
            },
        ],
    },
    {
        "state_id": "RJ",
        "state_name": "Rajasthan",
        "national_share_pct": 1.0,
        "estimated_reserves_mt": 4.5,
        "dominant_belt": "Aravalli Metasedimentary Belt",
        "primary_host_rocks": "Aravalli Supergroup quartzite, phyllite and chert",
        "key_operators": ["Rajasthan State Mines & Minerals Ltd (RSMML)", "Private Leases"],
        "center": {"lat": 23.53, "lng": 74.45},
        "bbox": {"west": 74.00, "south": 23.10, "east": 74.90, "north": 24.10},
        "districts": [
            {
                "district_id": "RJ-BW",
                "district_name": "Banswara",
                "geological_formation": "Aravalli Supergroup Quartzite-Phyllite Formation",
                "ore_mineralogy": "Stratiform Braunite, Pyrolusite, Psilomelane",
                "average_grade": "Medium Grade (34% - 42% Mn)",
                "mining_status": "Explored Belt / Selective Mining",
                "reserve_mt": 4.5,
                "center": {"lat": 23.53, "lng": 74.45},
                "bbox": {"west": 74.20, "south": 23.25, "east": 74.75, "north": 23.85},
                "key_mines": ["Tambesra Mine", "Sivnia Deposit", "Ghatia Prospect", "Sagwa"],
                "prospectivity_index": 0.72,
                "copernicus_s2_tiles": ["43QGF", "43QHF"],
            },
        ],
    },
    {
        "state_id": "GJ",
        "state_name": "Gujarat",
        "national_share_pct": 0.8,
        "estimated_reserves_mt": 3.6,
        "dominant_belt": "Champaner Manganese Belt",
        "primary_host_rocks": "Champaner Group (Aravalli Equivalent) calc-silicate & phyllite",
        "key_operators": ["Gujarat Mineral Development Corp (GMDC)"],
        "center": {"lat": 22.55, "lng": 73.65},
        "bbox": {"west": 73.30, "south": 22.20, "east": 74.10, "north": 22.95},
        "districts": [
            {
                "district_id": "GJ-PM",
                "district_name": "Panchmahal",
                "geological_formation": "Champaner Group metasediments",
                "ore_mineralogy": "Braunite and pyrolusite in quartzites and gondites",
                "average_grade": "Medium Grade (32% - 40% Mn)",
                "mining_status": "Historical Major Center (Shivrajpur)",
                "reserve_mt": 3.6,
                "center": {"lat": 22.55, "lng": 73.65},
                "bbox": {"west": 73.45, "south": 22.35, "east": 73.90, "north": 22.80},
                "key_mines": ["Shivrajpur Mine (Historic)", "Pani Deposit", "Bamankua"],
                "prospectivity_index": 0.70,
                "copernicus_s2_tiles": ["43QDE", "43QEE"],
            },
        ],
    },
    {
        "state_id": "GA",
        "state_name": "Goa",
        "national_share_pct": 0.6,
        "estimated_reserves_mt": 2.7,
        "dominant_belt": "Goa Lateritic Manganese Belt",
        "primary_host_rocks": "Dharwar Supergroup Metasediments & Lateritic Cap",
        "key_operators": ["State Mining Leaseholders"],
        "center": {"lat": 15.25, "lng": 74.15},
        "bbox": {"west": 73.70, "south": 14.90, "east": 74.40, "north": 15.60},
        "districts": [
            {
                "district_id": "GA-SG",
                "district_name": "South Goa",
                "geological_formation": "Lateritic manganese capping Dharwar phyllites",
                "ore_mineralogy": "Pyrolusite nodules and wad in ferruginous laterite",
                "average_grade": "Low to Medium Grade (25% - 35% Mn, Black Iron Ore)",
                "mining_status": "Co-extracted with Iron Ore",
                "reserve_mt": 2.7,
                "center": {"lat": 15.25, "lng": 74.15},
                "bbox": {"west": 74.00, "south": 15.05, "east": 74.35, "north": 15.45},
                "key_mines": ["Sanguem Valley", "Quepem Deposit", "Rivona Quarry"],
                "prospectivity_index": 0.63,
                "copernicus_s2_tiles": ["43PBR", "43PCR"],
            },
        ],
    },
]


def get_india_mineral_summary() -> dict[str, Any]:
    """Returns national aggregate statistics for manganese across India."""
    total_reserves = sum(s["estimated_reserves_mt"] for s in INDIA_MANGANESE_STATES)
    total_districts = sum(len(s["districts"]) for s in INDIA_MANGANESE_STATES)
    total_gsi_occurrences = len(KNOWN_MANGANESE_OCCURRENCES)

    return {
        "country": "India",
        "mineral": "Manganese Ore (Mn)",
        "total_estimated_reserves_mt": round(total_reserves, 1),
        "total_producing_states": len(INDIA_MANGANESE_STATES),
        "total_priority_districts": total_districts,
        "verified_gsi_occurrences_count": total_gsi_occurrences,
        "national_production_rank": "5th Globally (after South Africa, Gabon, Australia, China)",
        "key_geological_belts": [
            "Bonai-Keonjhar Belt & Jamda-Koira Valley (Odisha)",
            "Sausar Group Gondite Belt (Madhya Pradesh & Maharashtra)",
            "Sandur Schist Belt (Karnataka)",
            "Eastern Ghats Khondalite-Kodurite Belt (Andhra Pradesh & Odisha)",
            "Singhbhum Iron Ore Craton (Jharkhand)",
            "Aravalli & Champaner Supergroup (Rajasthan & Gujarat)",
        ],
        "state_shares": [
            {"state": s["state_name"], "state_id": s["state_id"], "share_pct": s["national_share_pct"], "reserves_mt": s["estimated_reserves_mt"]}
            for s in INDIA_MANGANESE_STATES
        ],
    }


def get_india_states_data() -> list[dict[str, Any]]:
    """
    Returns state and district list with live GSI occurrence counts injected
    from KNOWN_MANGANESE_OCCURRENCES.
    """
    results = []

    for state in INDIA_MANGANESE_STATES:
        state_copy = dict(state)
        state_occurrences = [
            o for o in KNOWN_MANGANESE_OCCURRENCES
            if o.get("state", "").lower() == state["state_name"].lower()
        ]
        state_copy["verified_occurrences_count"] = len(state_occurrences)

        # Inject district live occurrence counts
        districts_with_counts = []
        for dist in state["districts"]:
            dist_copy = dict(dist)
            dist_occ = [
                o for o in state_occurrences
                if dist["district_name"].lower().split()[0] in o.get("district", "").lower()
            ]
            dist_copy["verified_occurrences_count"] = len(dist_occ)
            dist_copy["occurrences"] = dist_occ
            districts_with_counts.append(dist_copy)

        state_copy["districts"] = districts_with_counts
        results.append(state_copy)

    return results


def get_district_details(district_id: str) -> Optional[dict[str, Any]]:
    """Returns deep-dive metadata and live occurrences for a specific district."""
    for state in INDIA_MANGANESE_STATES:
        for dist in state["districts"]:
            if dist["district_id"].upper() == district_id.upper():
                dist_copy = dict(dist)
                dist_copy["state_name"] = state["state_name"]
                dist_copy["state_id"] = state["state_id"]
                dist_copy["national_share_pct"] = state["national_share_pct"]
                
                # Fetch matching GSI records
                matching_occ = [
                    o for o in KNOWN_MANGANESE_OCCURRENCES
                    if o.get("state", "").lower() == state["state_name"].lower()
                    and dist["district_name"].lower().split()[0] in o.get("district", "").lower()
                ]
                dist_copy["occurrences"] = matching_occ
                dist_copy["verified_occurrences_count"] = len(matching_occ)
                return dist_copy

    return None
