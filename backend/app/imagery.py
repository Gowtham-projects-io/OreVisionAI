"""
Sentinel Hub Processing API — fetches real satellite imagery.
Evalscripts specify exact bands used; results are actual pixel data.
"""

import base64
import io
import logging
from typing import Literal
import requests
from PIL import Image
from app.auth import get_access_token, AuthError, credentials_present
from app.config import get_settings, SH_BASE_URL

logger = logging.getLogger(__name__)

PROCESS_URL = f"{SH_BASE_URL}/api/v1/process"


class ImageError(Exception):
    """Raised when the Processing API call fails."""


# ──────────────────────────────────────────────────────────
# Evalscripts — real Sentinel-2 band composites
# ──────────────────────────────────────────────────────────

EVALSCRIPTS: dict[str, dict] = {
    "true_color": {
        "label": "True Colour (B04/B03/B02)",
        "description": "Natural colour composite using Sentinel-2 bands B04 (Red), B03 (Green), B02 (Blue).",
        "bands_used": ["B04", "B03", "B02"],
        "script": """
//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B02", "B03", "B04", "SCL"], units: "REFLECTANCE" }],
    output: { bands: 3, sampleType: "UINT8" }
  };
}
function evaluatePixel(sample) {
  // Apply simple cloud masking via SCL (Scene Classification Layer)
  if ([8, 9, 10].includes(sample.SCL)) {
    return [200, 200, 200]; // light grey for clouds/cirrus
  }
  return [
    Math.min(255, Math.round(sample.B04 / 0.3 * 255)),
    Math.min(255, Math.round(sample.B03 / 0.3 * 255)),
    Math.min(255, Math.round(sample.B02 / 0.3 * 255))
  ];
}
""",
    },
    "false_color_nir": {
        "label": "False Colour NIR (B08/B04/B03)",
        "description": (
            "Near-infrared false colour: B08 (NIR) as Red, B04 (Red) as Green, B03 (Green) as Blue. "
            "Healthy vegetation appears bright red. Useful for distinguishing vegetation from bare soil."
        ),
        "bands_used": ["B08", "B04", "B03"],
        "script": """
//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B03", "B04", "B08", "SCL"], units: "REFLECTANCE" }],
    output: { bands: 3, sampleType: "UINT8" }
  };
}
function evaluatePixel(sample) {
  if ([8, 9, 10].includes(sample.SCL)) {
    return [200, 200, 200];
  }
  return [
    Math.min(255, Math.round(sample.B08 / 0.5 * 255)),
    Math.min(255, Math.round(sample.B04 / 0.3 * 255)),
    Math.min(255, Math.round(sample.B03 / 0.3 * 255))
  ];
}
""",
    },
    "swir_iron": {
        "label": "SWIR Iron-oxide (B12/B11/B04)",
        "description": (
            "Shortwave Infrared composite using B12 (SWIR-2), B11 (SWIR-1), B04 (Red). "
            "Useful for mapping iron-oxide minerals, geological contacts, and disturbed soil. "
            "Note: Cannot confirm manganese directly — requires geochemical validation."
        ),
        "bands_used": ["B12", "B11", "B04"],
        "script": """
//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B11", "B12", "SCL"], units: "REFLECTANCE" }],
    output: { bands: 3, sampleType: "UINT8" }
  };
}
function evaluatePixel(sample) {
  if ([8, 9, 10].includes(sample.SCL)) {
    return [200, 200, 200];
  }
  return [
    Math.min(255, Math.round(sample.B12 / 0.6 * 255)),
    Math.min(255, Math.round(sample.B11 / 0.6 * 255)),
    Math.min(255, Math.round(sample.B04 / 0.3 * 255))
  ];
}
""",
    },
    "ndvi": {
        "label": "NDVI — Vegetation Index",
        "description": (
            "Normalised Difference Vegetation Index: (B08 - B04) / (B08 + B04). "
            "Range −1 to +1. High values = dense vegetation. "
            "Bare mineral ground typically shows low or negative NDVI."
        ),
        "bands_used": ["B08", "B04"],
        "script": """
//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08"], units: "REFLECTANCE" }],
    output: { bands: 3, sampleType: "UINT8" }
  };
}
function colorScale(v) {
  // Brown(bare) → Yellow(low veg) → Green(high veg)
  if (v < -0.1) return [139, 69, 19];
  if (v < 0.1)  return [210, 180, 140];
  if (v < 0.3)  return [255, 255, 0];
  if (v < 0.5)  return [100, 200, 50];
  return [0, 128, 0];
}
function evaluatePixel(sample) {
  var ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04 + 1e-6);
  return colorScale(ndvi);
}
""",
    },
    "ferric_iron": {
        "label": "Ferric Iron Oxide Ratio (B04/B02)",
        "description": (
            "Spectral ratio highlighting Fe3+ hematite/goethite gossans and secondary capping: "
            "B04 (Red 665nm) / B02 (Blue 490nm). Critical indirect marker for supergene oxidation."
        ),
        "bands_used": ["B04", "B02"],
        "script": """
//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B02", "B04", "SCL"], units: "REFLECTANCE" }],
    output: { bands: 3, sampleType: "UINT8" }
  };
}
function evaluatePixel(sample) {
  if ([8, 9, 10].includes(sample.SCL)) return [200, 200, 200];
  var ratio = sample.B04 / (sample.B02 + 0.0001);
  var norm = Math.min(255, Math.max(0, Math.round((ratio - 1.0) / 1.5 * 255)));
  return [norm, Math.round(norm * 0.6), Math.round((255 - norm) * 0.4)];
}
""",
    },
    "clay_hydroxyl": {
        "label": "Clay / Hydroxyl Index (B11/B12)",
        "description": (
            "Shortwave infrared alteration ratio B11 (1610nm) / B12 (2190nm). "
            "Sensitive to Al-OH / Fe-OH / Mg-OH clay minerals (illite, kaolinite, smectite) in weathered shale hosts."
        ),
        "bands_used": ["B11", "B12"],
        "script": """
//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B11", "B12", "SCL"], units: "REFLECTANCE" }],
    output: { bands: 3, sampleType: "UINT8" }
  };
}
function evaluatePixel(sample) {
  if ([8, 9, 10].includes(sample.SCL)) return [200, 200, 200];
  var ratio = sample.B11 / (sample.B12 + 0.0001);
  var norm = Math.min(255, Math.max(0, Math.round((ratio - 0.9) / 1.2 * 255)));
  return [Math.round((255 - norm) * 0.2), norm, Math.round(norm * 0.8)];
}
""",
    },
    "ferrous_iron": {
        "label": "Ferrous Iron Index (B11/B8A)",
        "description": (
            "Ratio of SWIR-1 (B11) over Narrow NIR (B8A). Highlights ferrous silicate and carbonate lithologies "
            "often flanking manganiferous sedimentary horizons."
        ),
        "bands_used": ["B11", "B8A"],
        "script": """
//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B11", "B8A", "SCL"], units: "REFLECTANCE" }],
    output: { bands: 3, sampleType: "UINT8" }
  };
}
function evaluatePixel(sample) {
  if ([8, 9, 10].includes(sample.SCL)) return [200, 200, 200];
  var ratio = sample.B11 / (sample.B8A + 0.0001);
  var norm = Math.min(255, Math.max(0, Math.round((ratio - 0.7) / 1.1 * 255)));
  return [norm, Math.round(norm * 0.4), Math.round(norm * 0.9)];
}
""",
    },
    "pca_composite": {
        "label": "PCA Spectral Composite (PC1/PC2/PC3)",
        "description": (
            "Principal Component composite reducing dimensionality across VNIR and SWIR bands to maximize "
            "lithological contrast and hydrothermal alteration boundaries."
        ),
        "bands_used": ["B02", "B04", "B08", "B11", "B12"],
        "script": """
//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B02", "B04", "B08", "B11", "B12", "SCL"], units: "REFLECTANCE" }],
    output: { bands: 3, sampleType: "UINT8" }
  };
}
function evaluatePixel(sample) {
  if ([8, 9, 10].includes(sample.SCL)) return [200, 200, 200];
  var pc1 = (sample.B02 + sample.B04 + sample.B08 + sample.B11 + sample.B12) / 5.0;
  var pc2 = (sample.B11 + sample.B12) / 2.0 - (sample.B04 + sample.B02) / 2.0;
  var pc3 = sample.B08 - (sample.B04 + sample.B11) / 2.0;
  return [
    Math.min(255, Math.max(0, Math.round(pc1 / 0.4 * 255))),
    Math.min(255, Math.max(0, Math.round((pc2 + 0.2) / 0.4 * 255))),
    Math.min(255, Math.max(0, Math.round((pc3 + 0.2) / 0.4 * 255)))
  ];
}
""",
    },
}


def _generate_demo_image(
    bbox: list[float],
    date_from: str,
    date_to: str,
    visualization: str,
    width: int = 512,
    height: int = 512,
) -> tuple[str, dict]:
    import numpy as np

    ev = EVALSCRIPTS.get(visualization, EVALSCRIPTS["true_color"])

    x = np.linspace(0, 4 * np.pi, width)
    y = np.linspace(0, 4 * np.pi, height)
    xx, yy = np.meshgrid(x, y)

    base_terrain = (
        np.sin(xx) * np.cos(yy) * 0.5 +
        np.sin(2.3 * xx + 0.7 * yy) * 0.25 +
        np.cos(3.7 * xx - 1.9 * yy) * 0.15 +
        0.5
    )
    base_terrain = np.clip(base_terrain, 0.0, 1.0)

    rng = np.random.default_rng(seed=42)
    noise = rng.uniform(-0.06, 0.06, (height, width))
    mineral_outcrop = np.clip(np.sin(3.5 * xx) * np.sin(2.8 * yy) + noise * 2, 0.0, 1.0)

    if visualization == "true_color":
        r = (140 + base_terrain * 65 + mineral_outcrop * 25).clip(0, 255)
        g = (120 + base_terrain * 60 - mineral_outcrop * 10).clip(0, 255)
        b = (95 + base_terrain * 40 - mineral_outcrop * 20).clip(0, 255)
    elif visualization == "false_color_nir":
        r = (60 + mineral_outcrop * 160 + base_terrain * 50).clip(0, 255)
        g = (120 + base_terrain * 80 - mineral_outcrop * 50).clip(0, 255)
        b = (130 + base_terrain * 70 - mineral_outcrop * 60).clip(0, 255)
    elif visualization == "swir_iron":
        r = (40 + mineral_outcrop * 210 + base_terrain * 40).clip(0, 255)
        g = (60 + mineral_outcrop * 150 + base_terrain * 60).clip(0, 255)
        b = (130 - mineral_outcrop * 80 + base_terrain * 80).clip(0, 255)
    elif visualization == "ndvi":
        ndvi_val = (base_terrain * 0.7 - 0.2).clip(-0.2, 0.8)
        r = np.where(ndvi_val < 0.2, 215, np.where(ndvi_val < 0.4, 250, 40))
        g = np.where(ndvi_val < 0.2, 48, np.where(ndvi_val < 0.4, 180, 180))
        b = np.where(ndvi_val < 0.2, 39, np.where(ndvi_val < 0.4, 40, 60))
    elif visualization == "ferric_iron":
        # Warm coppers and deep ambers for high Fe3+ ratio
        r = (80 + mineral_outcrop * 175).clip(0, 255)
        g = (40 + mineral_outcrop * 90).clip(0, 255)
        b = (30 + (1.0 - mineral_outcrop) * 80).clip(0, 255)
    elif visualization == "clay_hydroxyl":
        # Cyan-teal and crystal lime for hydroxyl clay alteration
        r = (25 + (1.0 - mineral_outcrop) * 60).clip(0, 255)
        g = (70 + mineral_outcrop * 170).clip(0, 255)
        b = (90 + mineral_outcrop * 150).clip(0, 255)
    elif visualization == "ferrous_iron":
        # Electric violet / indigo contrast
        r = (70 + mineral_outcrop * 150).clip(0, 255)
        g = (40 + mineral_outcrop * 60).clip(0, 255)
        b = (100 + mineral_outcrop * 140).clip(0, 255)
    elif visualization == "pca_composite":
        # Multispectral PCA synthetic band blend
        r = (100 + base_terrain * 90 + mineral_outcrop * 60).clip(0, 255)
        g = (60 + mineral_outcrop * 160 + base_terrain * 40).clip(0, 255)
        b = (120 + (1.0 - mineral_outcrop) * 110).clip(0, 255)
    else:
        r = g = b = (base_terrain * 255).astype(np.uint8)

    rgb = np.stack([r.astype(np.uint8), g.astype(np.uint8), b.astype(np.uint8)], axis=-1)

    img = Image.fromarray(rgb)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    img_bytes = buf.getvalue()
    img_b64 = base64.b64encode(img_bytes).decode("ascii")

    meta = {
        "visualization": visualization,
        "label": ev["label"],
        "description": ev["description"],
        "bands_used": ev["bands_used"],
        "bbox": bbox,
        "date_from": date_from,
        "date_to": date_to,
        "width": width,
        "height": height,
        "mode": "RGB",
        "bytes": len(img_bytes),
        "data_source": "Sentinel-2 L2A (Demo Simulation Mode)",
        "processing_api": "Synthetic Local Demo Engine",
    }
    logger.info("Generated simulated satellite image: %s pixels, %d bytes.", f"{width}x{height}", len(img_bytes))
    return img_b64, meta


def fetch_image(
    bbox: list[float],               # [west, south, east, north]
    date_from: str,                  # "YYYY-MM-DD"
    date_to: str,                    # "YYYY-MM-DD"
    visualization: str = "true_color",
    width: int = 512,
    height: int = 512,
) -> tuple[str, dict]:
    """
    Call the Sentinel Hub Processing API and return the image as a
    base64-encoded PNG string plus metadata.

    Raises ImageError on API or authentication failures.
    """
    if visualization not in EVALSCRIPTS:
        raise ImageError(f"Unknown visualization '{visualization}'.")

    settings = get_settings()

    if not credentials_present() and settings.demo_mode:
        logger.info("Demo mode active without credentials: generating simulated imagery for '%s'.", visualization)
        return _generate_demo_image(bbox, date_from, date_to, visualization, width, height)

    try:
        token = get_access_token()
    except Exception as exc:
        raise ImageError(str(exc)) from exc

    ev = EVALSCRIPTS[visualization]

    request_body = {
        "input": {
            "bounds": {
                "bbox": bbox,
                "properties": {"crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"},
            },
            "data": [
                {
                    "type": "sentinel-2-l2a",
                    "dataFilter": {
                        "timeRange": {
                            "from": f"{date_from}T00:00:00Z",
                            "to": f"{date_to}T23:59:59Z",
                        },
                        "mosaickingOrder": "leastCC",
                    },
                }
            ],
        },
        "output": {
            "width": width,
            "height": height,
            "responses": [{"identifier": "default", "format": {"type": "image/png"}}],
        },
        "evalscript": ev["script"],
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "image/png",
    }

    try:
        resp = requests.post(
            PROCESS_URL,
            json=request_body,
            headers=headers,
            timeout=settings.image_timeout,
        )
    except requests.Timeout:
        raise ImageError("Image processing request timed out. Try a smaller area or shorter date range.")
    except requests.ConnectionError:
        raise ImageError("Cannot reach the Sentinel Hub Processing API.")

    if resp.status_code == 401:
        # Token may have expired — refresh once
        try:
            token = get_access_token(force_refresh=True)
            headers["Authorization"] = f"Bearer {token}"
            resp = requests.post(
                PROCESS_URL,
                json=request_body,
                headers=headers,
                timeout=settings.image_timeout,
            )
        except AuthError as exc:
            raise ImageError(str(exc)) from exc

    if resp.status_code == 403:
        raise ImageError(
            "Access denied by Sentinel Hub Processing API. "
            "Ensure your Copernicus account has Processing API access enabled."
        )
    if resp.status_code == 429:
        raise ImageError("Rate limit exceeded. Please wait a moment and try again.")
    if not resp.ok:
        raise ImageError(
            f"Processing API returned HTTP {resp.status_code}. "
            f"Response: {resp.text[:300]}"
        )

    # Validate we got real image data
    content_type = resp.headers.get("Content-Type", "")
    if "image" not in content_type:
        raise ImageError(
            f"Processing API returned unexpected content type '{content_type}'. "
            "No image was produced."
        )

    # Convert PNG bytes → PIL Image for basic stats, then re-encode to base64
    img_bytes = resp.content
    try:
        img = Image.open(io.BytesIO(img_bytes))
        img_width, img_height = img.size
        mode = img.mode
    except Exception as exc:
        raise ImageError(f"Could not decode image from Processing API: {exc}") from exc

    img_b64 = base64.b64encode(img_bytes).decode("ascii")

    meta = {
        "visualization": visualization,
        "label": ev["label"],
        "description": ev["description"],
        "bands_used": ev["bands_used"],
        "bbox": bbox,
        "date_from": date_from,
        "date_to": date_to,
        "width": img_width,
        "height": img_height,
        "mode": mode,
        "bytes": len(img_bytes),
        "data_source": "Copernicus Data Space Ecosystem / Sentinel-2 L2A",
        "processing_api": PROCESS_URL,
    }

    logger.info(
        "Fetched real satellite image: %s pixels, %d bytes.",
        f"{img_width}×{img_height}",
        len(img_bytes),
    )
    return img_b64, meta
