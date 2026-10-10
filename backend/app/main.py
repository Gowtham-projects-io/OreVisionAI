"""
OreVision AI — FastAPI Backend
Milestone 1: Health, Scene Catalog, Image Processing.
"""

import os
import sys
# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.analysis import (
    KNOWN_MANGANESE_OCCURRENCES,
    get_analysis_status,
    predict_prospectivity,
    reset_occurrences_to_default,
    run_change_detection,
    train_prospectivity_model,
    validate_and_add_occurrences,
)
from app.auth import AuthError, credentials_present
from app.catalog import CatalogError, search_scenes
from app.config import get_settings
from app.imagery import EVALSCRIPTS, ImageError, fetch_image
from app.models import (
    AnalysisStatusResponse,
    ChangeDetectionRequest,
    ChangeDetectionResponse,
    ErrorResponse,
    HealthResponse,
    ImageRequest,
    ImageResponse,
    OccurrenceUploadRequest,
    OccurrenceUploadResponse,
    ProspectivityRequest,
    ProspectivityResponse,
    SceneResponse,
    SceneSearchRequest,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("OreVision AI backend starting up.")
    yield
    logger.info("OreVision AI backend shutting down.")


app = FastAPI(
    title="OreVision AI — Satellite Mineral Intelligence",
    description=(
        "Backend API for OreVision AI. "
        "Connects to real Copernicus Sentinel-2 data via the CDSE APIs. "
        "All credentials are server-side only."
    ),
    version="1.0.0-milestone1",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ── Helper ────────────────────────────────────────────────
def _handle_auth_catalog_error(exc: Exception) -> HTTPException:
    msg = str(exc)
    # Never expose credential values in HTTP error responses
    code = 502  # default: upstream error
    if any(k in msg for k in ("timed out", "Cannot reach", "not configured", "not yet configured")):
        code = 503
    if "invalid credentials" in msg or "unauthorised" in msg:
        code = 401
    if "Rate limit" in msg or "rate limit" in msg:
        code = 429
    return HTTPException(status_code=code, detail=msg)


# ── Routes ────────────────────────────────────────────────

@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
async def health():
    """
    Returns API health status and whether Copernicus credentials are present.
    Does NOT attempt a live network call.
    """
    creds = credentials_present()
    is_demo = settings.demo_mode and not creds
    return HealthResponse(
        status="ok",
        version="1.0.0-milestone1",
        credentials_configured=creds,
        demo_mode=is_demo,
        message=(
            "Credentials configured — ready to connect to Copernicus."
            if creds
            else (
                "Demo Mode active — previewing with simulated Sentinel-2 data (no API keys required)."
                if is_demo
                else "Credentials NOT configured. Set SH_CLIENT_ID and SH_CLIENT_SECRET."
            )
        ),
    )


@app.post("/api/satellite/scenes", response_model=SceneResponse, tags=["Satellite"])
async def get_scenes(req: SceneSearchRequest):
    """
    Search the CDSE Catalog for real Sentinel-2 L2A scenes within the
    given bounding box and date range.

    Returns an empty list (not an error) when no scenes are found.
    """
    bbox = [req.west, req.south, req.east, req.north]

    try:
        scenes = search_scenes(
            bbox=bbox,
            date_from=req.date_from,
            date_to=req.date_to,
            max_cloud_cover=req.max_cloud_cover,
            max_results=req.max_results,
        )
    except CatalogError as exc:
        raise _handle_auth_catalog_error(exc)

    return SceneResponse(
        scenes=scenes,
        count=len(scenes),
        query={
            "bbox": bbox,
            "date_from": req.date_from,
            "date_to": req.date_to,
            "max_cloud_cover": req.max_cloud_cover,
        },
    )


@app.post("/api/satellite/image", response_model=ImageResponse, tags=["Satellite"])
async def get_image(req: ImageRequest):
    """
    Fetch a real processed Sentinel-2 image from the Sentinel Hub Processing API.

    Returns actual pixel data; never substitutes placeholder imagery.
    """
    bbox = [req.west, req.south, req.east, req.north]

    try:
        img_b64, meta = fetch_image(
            bbox=bbox,
            date_from=req.date_from,
            date_to=req.date_to,
            visualization=req.visualization,
            width=req.width,
            height=req.height,
        )
    except ImageError as exc:
        raise _handle_auth_catalog_error(exc)

    return ImageResponse(
        image_base64=img_b64,
        content_type="image/png",
        metadata=meta,
    )


@app.post("/api/analysis/preview", tags=["Analysis"])
async def analysis_preview(req: ImageRequest):
    """
    Request spectral analysis of a scene.
    Currently returns scene metadata and band information.
    Full ML model integration is planned for Milestone 4.
    """
    status = get_analysis_status()
    ev_info = {k: {"label": v["label"], "description": v["description"], "bands": v["bands_used"]}
               for k, v in EVALSCRIPTS.items()}

    return {
        "analysis_status": status,
        "available_visualizations": ev_info,
        "area_of_interest": {
            "bbox": [req.west, req.south, req.east, req.north],
            "date_from": req.date_from,
            "date_to": req.date_to,
        },
        "notice": (
            "Full manganese prospectivity analysis requires Milestone 4 "
            "(verified occurrence records + model training). "
            "Only spectral visualization is available in Milestone 1."
        ),
    }


@app.get("/api/analysis/status", response_model=AnalysisStatusResponse, tags=["Analysis"])
async def analysis_status():
    """Return current ML model training status."""
    return get_analysis_status()


@app.get("/api/visualizations", tags=["Satellite"])
async def list_visualizations():
    """List available spectral band composites."""
    return {
        k: {"label": v["label"], "description": v["description"], "bands_used": v["bands_used"]}
        for k, v in EVALSCRIPTS.items()
    }


@app.post("/api/analysis/prospectivity", response_model=ProspectivityResponse, tags=["Analysis"])
async def prospectivity_analysis(req: ProspectivityRequest):
    """
    Run machine-learning manganese prospectivity model on the given bounding box.
    Returns prospectivity heatmap, detected exploration targets, and nearby GSI occurrences.
    """
    try:
        return predict_prospectivity(req)
    except Exception as exc:
        logger.exception("Prospectivity analysis failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Prospectivity analysis error: {exc}")


@app.post("/api/analysis/prospectivity/train", tags=["Analysis"])
async def retrain_model():
    """
    Train or retrain the Random Forest prospectivity model against multi-spectral ground truth.
    """
    try:
        metrics = train_prospectivity_model()
        return {
            "status": "success",
            "message": "Prospectivity machine-learning model trained successfully.",
            "metrics": metrics,
        }
    except Exception as exc:
        logger.exception("Model training failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Model training error: {exc}")


@app.post("/api/analysis/change-detection", response_model=ChangeDetectionResponse, tags=["Analysis"])
async def change_detection(req: ChangeDetectionRequest):
    """
    Run multi-date satellite surface change detection to monitor open-cast pits,
    excavation areas, and environmental disturbance.
    """
    try:
        return run_change_detection(req)
    except Exception as exc:
        logger.exception("Change detection failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Change detection error: {exc}")


@app.get("/api/geology/occurrences", tags=["Geology"])
async def get_geological_occurrences():
    """
    Return verified manganese occurrences repository from Geological Survey of India.
    """
    return {
        "count": len(KNOWN_MANGANESE_OCCURRENCES),
        "occurrences": KNOWN_MANGANESE_OCCURRENCES,
    }


@app.post("/api/geology/occurrences/upload", response_model=OccurrenceUploadResponse, tags=["Geology"])
async def upload_occurrences(req: OccurrenceUploadRequest):
    """
    Upload and validate GSI Bhukosh or IBM verified occurrence records.
    Strict schema validation: rejects invalid coordinates or missing deposits.
    """
    try:
        res = validate_and_add_occurrences(req.records)
        return OccurrenceUploadResponse(**res)
    except Exception as exc:
        logger.exception("Occurrence upload failed: %s", exc)
        raise HTTPException(status_code=400, detail=f"Occurrence upload error: {exc}")


@app.post("/api/geology/occurrences/reset", tags=["Geology"])
async def reset_occurrences():
    """
    Reset occurrences repository to default verified GSI occurrences.
    """
    try:
        return reset_occurrences_to_default()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/geology/occurrences/template", tags=["Geology"])
async def occurrences_csv_template():
    """
    Download sample GSI Bhukosh occurrence CSV template structure.
    """
    csv_text = (
        "name,district,state,latitude,longitude,geological_formation,ore_type,grade,status\n"
        "Barabil Central,Kendujhar,Odisha,22.1245,85.3852,IOG Shales & Cherts,Pyrolusite-Psilomelane,42% Mn,Active Mine\n"
        "Koira South,Sundargarh,Odisha,21.9123,85.2415,Iron Ore Supergroup,Lateritoid Pocket Ore,38% Mn,Active Lease\n"
        "Joda East Sector,Kendujhar,Odisha,22.0184,85.4312,Bonai-Keonjhar Belt,Wad & Cryptomelane,40% Mn,Active Pit\n"
    )
    return {
        "filename": "gsi_manganese_template.csv",
        "csv_content": csv_text,
    }


@app.get("/api/geology/india/summary", tags=["India Mineral Atlas"])
async def india_mineral_summary():
    """
    Returns national summary of manganese reserves, geological belts, and state shares across India.
    """
    from app.india_atlas import get_india_mineral_summary
    return get_india_mineral_summary()


@app.get("/api/geology/india/states", tags=["India Mineral Atlas"])
async def india_states_and_districts():
    """
    Returns live structured data for all Indian manganese-producing states and districts
    with live GSI occurrence counts.
    """
    from app.india_atlas import get_india_states_data
    return {"states": get_india_states_data()}


@app.get("/api/geology/india/districts/{district_id}", tags=["India Mineral Atlas"])
async def india_district_detail(district_id: str):
    """
    Returns deep-dive metadata, reserve tonnages, and verified GSI occurrences for a specific district.
    """
    from app.india_atlas import get_district_details
    detail = get_district_details(district_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"District '{district_id}' not found.")
    return detail


# ── Global exception handler ─────────────────────────────

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    msg = str(exc)
    # Map known error types to appropriate HTTP codes
    if "not configured" in msg or "timed out" in msg or "Cannot reach" in msg:
        code = 503
    elif "invalid credentials" in msg or "unauthorised" in msg:
        code = 401
    else:
        code = 500
    logger.error("Unhandled exception [%s]: %s", type(exc).__name__, type(exc).__name__)
    return JSONResponse(
        status_code=code,
        content={"error": "Request failed", "detail": msg[:300] if code != 500 else "An unexpected error occurred."},
    )
