"""
Pydantic request / response models for OreVision AI API.
"""

from typing import Any, Optional
from pydantic import BaseModel, field_validator


class SceneSearchRequest(BaseModel):
    west: float
    south: float
    east: float
    north: float
    date_from: str       # "YYYY-MM-DD"
    date_to: str         # "YYYY-MM-DD"
    max_cloud_cover: float = 80.0
    max_results: int = 20

    @field_validator("max_cloud_cover")
    @classmethod
    def cloud_cover_range(cls, v: float) -> float:
        if not (0.0 <= v <= 100.0):
            raise ValueError("max_cloud_cover must be between 0 and 100.")
        return v

    @field_validator("max_results")
    @classmethod
    def results_range(cls, v: int) -> int:
        if not (1 <= v <= 100):
            raise ValueError("max_results must be between 1 and 100.")
        return v


class ImageRequest(BaseModel):
    west: float
    south: float
    east: float
    north: float
    date_from: str
    date_to: str
    visualization: str = "true_color"
    width: int = 512
    height: int = 512

    @field_validator("visualization")
    @classmethod
    def viz_choices(cls, v: str) -> str:
        valid = {
            "true_color",
            "false_color_nir",
            "swir_iron",
            "ndvi",
            "ferric_iron",
            "clay_hydroxyl",
            "ferrous_iron",
            "pca_composite",
        }
        if v not in valid:
            raise ValueError(f"visualization must be one of {sorted(valid)}.")
        return v

    @field_validator("width", "height")
    @classmethod
    def size_limits(cls, v: int) -> int:
        if not (64 <= v <= 2500):
            raise ValueError("Image dimensions must be between 64 and 2500 pixels.")
        return v


class HealthResponse(BaseModel):
    status: str
    version: str
    credentials_configured: bool
    message: str
    demo_mode: bool = False


class SceneResponse(BaseModel):
    scenes: list[dict[str, Any]]
    count: int
    query: dict[str, Any]


class ImageResponse(BaseModel):
    image_base64: str
    content_type: str
    metadata: dict[str, Any]


class AnalysisStatusResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    model_status: str
    model_accuracy: Optional[float]
    training_date: Optional[str]
    message: str
    limitations: list[str]
    model_metrics: Optional[dict[str, Any]] = None
    occurrences_count: int = 0
    min_occurrences_required: int = 5


class ProspectivityRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    west: float
    south: float
    east: float
    north: float
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    threshold: float = 0.60
    model_type: str = "random_forest"  # "random_forest" | "xgboost" | "ensemble"

    @field_validator("threshold")
    @classmethod
    def threshold_range(cls, v: float) -> float:
        if not (0.1 <= v <= 0.99):
            raise ValueError("threshold must be between 0.1 and 0.99.")
        return v

    @field_validator("model_type")
    @classmethod
    def model_type_choice(cls, v: str) -> str:
        valid = {"random_forest", "xgboost", "ensemble"}
        if v.lower() not in valid:
            raise ValueError(f"model_type must be one of {sorted(valid)}.")
        return v.lower()


class ProspectivityTarget(BaseModel):
    target_id: str
    latitude: float
    longitude: float
    prospectivity_score: float
    confidence_pct: float
    dominant_indicator: str
    estimated_area_ha: float
    recommended_validation: str
    designation: str = "prospective area for field verification"
    evidence_breakdown: Optional[dict[str, float]] = None


class ProspectivityResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    heatmap_base64: str
    uncertainty_heatmap_base64: Optional[str] = None
    applicability_mask_base64: Optional[str] = None
    model_type: str = "random_forest"
    model_metrics: dict[str, Any]
    targets: list[ProspectivityTarget]
    total_targets: int
    mean_prospectivity: float
    mean_uncertainty: float = 0.0
    area_bbox: list[float]
    known_occurrences: list[dict[str, Any]]
    label_designation: str = "prospective area for field verification"
    data_layers_summary: Optional[dict[str, Any]] = None
    disclaimer: str


class ChangeDetectionRequest(BaseModel):
    west: float
    south: float
    east: float
    north: float
    baseline_date: str
    monitoring_date: str
    sensitivity: float = 0.5


class ChangeDetectionResponse(BaseModel):
    baseline_image_base64: str
    monitoring_image_base64: str
    difference_heatmap_base64: str
    metrics: dict[str, Any]
    hotspots: list[dict[str, Any]]
    class_breakdown: dict[str, float]
    summary: str


class OccurrenceUploadRequest(BaseModel):
    records: list[dict[str, Any]]


class OccurrenceUploadResponse(BaseModel):
    status: str
    total_records: int
    added_records: int
    validation_errors: list[str] = []
    message: str


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None


