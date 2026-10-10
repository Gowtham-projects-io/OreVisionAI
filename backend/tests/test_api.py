"""
Automated tests for OreVision AI backend.
Mock data is used ONLY inside these tests; the application never
displays mock imagery as real satellite data.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import base64
import io
import json
import unittest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from PIL import Image


# ── Patch credentials before importing app ────────────────────────
os.environ["SH_CLIENT_ID"] = "test-client-id"
os.environ["SH_CLIENT_SECRET"] = "test-client-secret"

from app.main import app

client = TestClient(app)


def _make_png_bytes(width=16, height=16, color=(100, 150, 200)) -> bytes:
    """Create minimal valid PNG bytes (used ONLY in tests)."""
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ═══════════════════════════════════════════════════════════════════
# 1. Health Endpoint
# ═══════════════════════════════════════════════════════════════════

class TestHealthEndpoint(unittest.TestCase):

    def test_health_ok(self):
        resp = client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("version", data)
        self.assertIn("credentials_configured", data)

    def test_health_credentials_present(self):
        resp = client.get("/api/health")
        data = resp.json()
        # We set env vars above, so credentials should appear configured
        self.assertTrue(data["credentials_configured"])


# ═══════════════════════════════════════════════════════════════════
# 2. Scene Catalog Endpoint
# ═══════════════════════════════════════════════════════════════════

class TestSceneEndpoint(unittest.TestCase):

    VALID_REQUEST = {
        "west": 79.0, "south": 20.0, "east": 80.0, "north": 21.0,
        "date_from": "2024-01-01", "date_to": "2024-01-31",
        "max_cloud_cover": 30.0, "max_results": 5,
    }

    def test_missing_credentials_returns_503(self):
        """When credentials are blank, AuthError should propagate as 503."""
        with patch("app.catalog.get_access_token", side_effect=Exception("credentials not configured")):
            resp = client.post("/api/satellite/scenes", json=self.VALID_REQUEST)
            self.assertIn(resp.status_code, [401, 502, 503])

    def test_catalog_timeout_returns_503(self):
        import requests as req_lib
        with patch("app.catalog.get_access_token", return_value="fake-token"), \
             patch("app.catalog.requests.post", side_effect=req_lib.Timeout):
            resp = client.post("/api/satellite/scenes", json=self.VALID_REQUEST)
            self.assertEqual(resp.status_code, 503)

    def test_catalog_empty_results(self):
        """Empty result set should return 200 with count=0, not an error."""
        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"features": []}
        with patch("app.catalog.get_access_token", return_value="fake-token"), \
             patch("app.catalog.requests.post", return_value=mock_resp):
            resp = client.post("/api/satellite/scenes", json=self.VALID_REQUEST)
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertEqual(data["count"], 0)
            self.assertEqual(data["scenes"], [])

    def test_catalog_real_scene_structure(self):
        """Mock a realistic Catalog API response and verify field extraction."""
        mock_feature = {
            "id": "S2A_MSIL2A_20240115T054051_N0510_R091_T44QPD_20240115T085102",
            "bbox": [79.0, 20.0, 80.0, 21.0],
            "geometry": {"type": "Polygon", "coordinates": [[]]},
            "properties": {
                "datetime": "2024-01-15T05:40:51Z",
                "eo:cloud_cover": 12.5,
                "platform": "sentinel-2a",
                "instruments": ["msi"],
                "s2:mgrs_tile": "44QPD",
                "s2:product_type": "S2MSI2A",
            },
            "assets": {
                "thumbnail": {"href": "https://example.com/thumbnail.jpg"}
            },
        }
        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"features": [mock_feature]}
        with patch("app.catalog.get_access_token", return_value="fake-token"), \
             patch("app.catalog.requests.post", return_value=mock_resp):
            resp = client.post("/api/satellite/scenes", json=self.VALID_REQUEST)
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertEqual(data["count"], 1)
            scene = data["scenes"][0]
            self.assertEqual(scene["scene_id"], mock_feature["id"])
            self.assertAlmostEqual(scene["cloud_cover"], 12.5)
            self.assertEqual(scene["platform"], "sentinel-2a")
            self.assertEqual(scene["data_source"],
                             "Copernicus Data Space Ecosystem / Sentinel-2 L2A")

    def test_invalid_cloud_cover(self):
        bad = {**self.VALID_REQUEST, "max_cloud_cover": 150.0}
        resp = client.post("/api/satellite/scenes", json=bad)
        self.assertEqual(resp.status_code, 422)

    def test_invalid_max_results(self):
        bad = {**self.VALID_REQUEST, "max_results": 0}
        resp = client.post("/api/satellite/scenes", json=bad)
        self.assertEqual(resp.status_code, 422)


# ═══════════════════════════════════════════════════════════════════
# 3. Image Endpoint
# ═══════════════════════════════════════════════════════════════════

class TestImageEndpoint(unittest.TestCase):

    VALID_REQUEST = {
        "west": 79.0, "south": 20.0, "east": 80.0, "north": 21.0,
        "date_from": "2024-01-01", "date_to": "2024-01-31",
        "visualization": "true_color", "width": 64, "height": 64,
    }

    def test_image_invalid_visualization(self):
        bad = {**self.VALID_REQUEST, "visualization": "fake_rainbow"}
        resp = client.post("/api/satellite/image", json=bad)
        self.assertEqual(resp.status_code, 422)

    def test_image_size_limits(self):
        bad = {**self.VALID_REQUEST, "width": 9999}
        resp = client.post("/api/satellite/image", json=bad)
        self.assertEqual(resp.status_code, 422)

    def test_image_rate_limit_handling(self):
        mock_resp = MagicMock()
        mock_resp.ok = False
        mock_resp.status_code = 429
        mock_resp.text = "rate limit exceeded"
        with patch("app.imagery.get_access_token", return_value="fake-token"), \
             patch("app.imagery.requests.post", return_value=mock_resp):
            resp = client.post("/api/satellite/image", json=self.VALID_REQUEST)
            self.assertIn(resp.status_code, [429, 502, 503])

    def test_image_returns_valid_base64_png(self):
        """Mock a successful image response and verify base64 decoding."""
        png_bytes = _make_png_bytes(64, 64, (50, 100, 180))
        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.status_code = 200
        mock_resp.content = png_bytes
        mock_resp.headers = {"Content-Type": "image/png"}
        with patch("app.imagery.get_access_token", return_value="fake-token"), \
             patch("app.imagery.requests.post", return_value=mock_resp):
            resp = client.post("/api/satellite/image", json=self.VALID_REQUEST)
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertIn("image_base64", data)
            decoded = base64.b64decode(data["image_base64"])
            # Must be a valid PNG
            img = Image.open(io.BytesIO(decoded))
            self.assertEqual(img.size, (64, 64))
            # Verify metadata
            self.assertEqual(data["metadata"]["data_source"],
                             "Copernicus Data Space Ecosystem / Sentinel-2 L2A")
            self.assertEqual(data["metadata"]["bands_used"], ["B04", "B03", "B02"])


# ═══════════════════════════════════════════════════════════════════
# 4. Analysis Status Endpoint
# ═══════════════════════════════════════════════════════════════════

class TestAnalysisStatus(unittest.TestCase):

    def test_status_response(self):
        resp = client.get("/api/analysis/status")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn(data["model_status"], ["trained", "not_trained"])
        self.assertIsInstance(data["limitations"], list)
        self.assertTrue(len(data["limitations"]) > 0)
        if data["model_status"] == "trained":
            self.assertIsNotNone(data["model_accuracy"])
            self.assertIn("model_metrics", data)

    def test_status_message_present(self):
        resp = client.get("/api/analysis/status")
        data = resp.json()
        self.assertIn("message", data)
        self.assertTrue(len(data["message"]) > 10)


# ═══════════════════════════════════════════════════════════════════
# 5. Prospectivity & Change Detection Endpoints
# ═══════════════════════════════════════════════════════════════════

class TestProspectivityAndChangeDetection(unittest.TestCase):

    def test_prospectivity_prediction(self):
        payload = {
            "west": 79.5,
            "south": 21.0,
            "east": 80.5,
            "north": 22.0,
            "threshold": 0.6,
        }
        resp = client.post("/api/analysis/prospectivity", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("heatmap_base64", data)
        self.assertIn("targets", data)
        self.assertIn("model_metrics", data)
        self.assertIn("known_occurrences", data)

    def test_prospectivity_train(self):
        resp = client.post("/api/analysis/prospectivity/train")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("metrics", data)

    def test_change_detection(self):
        payload = {
            "west": 79.5,
            "south": 21.0,
            "east": 80.5,
            "north": 22.0,
            "baseline_date": "2024-01-01",
            "monitoring_date": "2024-03-01",
            "sensitivity": 0.6,
        }
        resp = client.post("/api/analysis/change-detection", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("baseline_image_base64", data)
        self.assertIn("monitoring_image_base64", data)
        self.assertIn("difference_heatmap_base64", data)
        self.assertIn("metrics", data)
        self.assertIn("hotspots", data)

    def test_geological_occurrences(self):
        resp = client.get("/api/geology/occurrences")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["count"] > 0)
        self.assertTrue(len(data["occurrences"]) > 0)

    def test_occurrences_template(self):
        resp = client.get("/api/geology/occurrences/template")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("filename", data)
        self.assertIn("csv_content", data)
        self.assertIn("Barabil", data["csv_content"])

    def test_occurrences_upload_valid_and_reset(self):
        # Valid upload
        valid_records = [
            {
                "name": "Kasia North Trench Prospect",
                "district": "Kendujhar",
                "state": "Odisha",
                "latitude": 22.055,
                "longitude": 85.412,
                "geological_formation": "Bonai-Keonjhar Belt, IOG",
                "ore_type": "Pyrolusite lenses",
                "grade": "42% Mn",
                "status": "Verified Prospect",
            }
        ]
        resp = client.post("/api/geology/occurrences/upload", json={"records": valid_records})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["added_records"], 1)

        # Reset back
        reset_resp = client.post("/api/geology/occurrences/reset")
        self.assertEqual(reset_resp.status_code, 200)
        self.assertEqual(reset_resp.json()["status"], "success")

    def test_occurrences_upload_invalid_schema(self):
        invalid_records = [
            {
                "name": "",  # missing name
                "latitude": "not-a-number",
                "longitude": 999.0,  # out of bounds
            }
        ]
        resp = client.post("/api/geology/occurrences/upload", json={"records": invalid_records})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "error")
        self.assertEqual(data["added_records"], 0)
        self.assertTrue(len(data["validation_errors"]) > 0)

    def test_prospectivity_models_and_uncertainty(self):
        # Test Random Forest, uncertainty, mask, and evidence breakdown
        payload = {
            "west": 85.1,
            "south": 21.8,
            "east": 85.6,
            "north": 22.3,
            "threshold": 0.55,
            "model_type": "random_forest",
        }
        resp = client.post("/api/analysis/prospectivity", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("heatmap_base64", data)
        self.assertIn("uncertainty_heatmap_base64", data)
        self.assertIn("applicability_mask_base64", data)
        self.assertEqual(data["label_designation"], "prospective area for field verification")
        self.assertIn("model_metrics", data)
        self.assertIn("spatial_blocks", data["model_metrics"])

        # Check target evidence breakdown
        if data["targets"]:
            tgt = data["targets"][0]
            self.assertEqual(tgt["designation"], "prospective area for field verification")
            self.assertIn("evidence_breakdown", tgt)
            self.assertIn("ferric_iron_oxide", tgt["evidence_breakdown"])

    def test_new_spectral_visualizations(self):
        from app.imagery import EVALSCRIPTS, _generate_demo_image
        png_bytes = _make_png_bytes(64, 64, (50, 100, 180))
        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.status_code = 200
        mock_resp.headers = {"Content-Type": "image/png"}
        mock_resp.content = png_bytes

        for viz in ["ferric_iron", "clay_hydroxyl", "ferrous_iron", "pca_composite"]:
            self.assertIn(viz, EVALSCRIPTS)
            self.assertTrue(len(EVALSCRIPTS[viz]["bands_used"]) >= 2)

            # Test demo image generation
            b64, meta = _generate_demo_image([85.2, 21.9, 85.5, 22.2], "2024-01-01", "2024-03-01", viz, 64, 64)
            self.assertTrue(len(b64) > 0)
            self.assertEqual(meta["visualization"], viz)

            # Test API endpoint with mock
            payload = {
                "west": 85.2,
                "south": 21.9,
                "east": 85.5,
                "north": 22.2,
                "date_from": "2024-01-01",
                "date_to": "2024-03-01",
                "visualization": viz,
                "width": 64,
                "height": 64,
            }
            with patch("app.imagery.get_access_token", return_value="fake-token"), \
                 patch("app.imagery.requests.post", return_value=mock_resp):
                resp = client.post("/api/satellite/image", json=payload)
                self.assertEqual(resp.status_code, 200)
                data = resp.json()
                self.assertIn("image_base64", data)
                self.assertEqual(data["metadata"]["visualization"], viz)


# ═══════════════════════════════════════════════════════════════════
# 6. Input Validation
# ═══════════════════════════════════════════════════════════════════

class TestInputValidation(unittest.TestCase):

    def test_scene_missing_required_fields(self):
        resp = client.post("/api/satellite/scenes", json={"west": 79.0})
        self.assertEqual(resp.status_code, 422)

    def test_image_missing_required_fields(self):
        resp = client.post("/api/satellite/image", json={"west": 79.0})
        self.assertEqual(resp.status_code, 422)



class TestIndiaAtlas(unittest.TestCase):

    def test_india_summary(self):
        resp = client.get("/api/geology/india/summary")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["country"], "India")
        self.assertIn("total_estimated_reserves_mt", data)
        self.assertTrue(data["total_producing_states"] >= 8)
        self.assertTrue(len(data["state_shares"]) >= 8)

    def test_india_states_and_districts(self):
        resp = client.get("/api/geology/india/states")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("states", data)
        states = data["states"]
        self.assertTrue(len(states) >= 8)
        # Check Odisha and MP
        odisha = next((s for s in states if s["state_id"] == "OD"), None)
        self.assertIsNotNone(odisha)
        self.assertTrue(len(odisha["districts"]) >= 3)
        self.assertTrue(odisha["verified_occurrences_count"] >= 5)

    def test_india_district_detail(self):
        resp = client.get("/api/geology/india/districts/OD-KJ")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["district_name"], "Kendujhar (Keonjhar)")
        self.assertEqual(data["state_name"], "Odisha")
        self.assertIn("bbox", data)
        self.assertIn("copernicus_s2_tiles", data)
        self.assertTrue(len(data["occurrences"]) >= 3)

    def test_india_district_not_found(self):
        resp = client.get("/api/geology/india/districts/NON-EXISTENT")
        self.assertEqual(resp.status_code, 404)


if __name__ == "__main__":
    unittest.main(verbosity=2)
