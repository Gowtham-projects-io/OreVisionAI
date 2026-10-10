"""
Configuration management for OreVision AI backend.
All Copernicus/Sentinel Hub credentials are loaded from environment variables
(server-side Secrets) — never from the frontend or hardcoded.
"""

import os
from pathlib import Path
from functools import lru_cache
from dataclasses import dataclass
from dotenv import load_dotenv

# Load local environment variables if .env exists
_backend_env = Path(__file__).resolve().parent.parent / ".env"
_root_env = Path(__file__).resolve().parent.parent.parent / ".env"
if _backend_env.exists():
    load_dotenv(dotenv_path=_backend_env)
elif _root_env.exists():
    load_dotenv(dotenv_path=_root_env)
else:
    load_dotenv()


# ──────────────────────────────────────────────
# Copernicus Data Space Ecosystem endpoints
# ──────────────────────────────────────────────
CDSE_TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
CDSE_CATALOG_URL = "https://catalogue.dataspace.copernicus.eu/stac/search"
CDSE_PROCESS_URL = "https://sh.dataspace.copernicus.eu/api/v1/process"

# Sentinel-2 L2A STAC collection identifier on CDSE
S2L2A_COLLECTION = "SENTINEL-2"
S2L2A_STAC_COLLECTION = "SENTINEL-2"

# Sentinel Hub processing API base
SH_BASE_URL = "https://sh.dataspace.copernicus.eu"


@dataclass
class Settings:
    # Credentials loaded from server-side environment variables only
    sh_client_id: str
    sh_client_secret: str

    # Application
    debug: bool
    cors_origins: list[str]
    demo_mode: bool = True

    # Request timeouts (seconds)
    auth_timeout: int = 15
    catalog_timeout: int = 30
    image_timeout: int = 60


@lru_cache()
def get_settings() -> Settings:
    """
    Load application settings from environment variables.
    Raises RuntimeError if required credentials are absent.
    """
    client_id = os.environ.get("SH_CLIENT_ID", "")
    client_secret = os.environ.get("SH_CLIENT_SECRET", "")

    debug_flag = os.environ.get("DEBUG", "false").lower() == "true"
    demo_flag = os.environ.get("DEMO_MODE", "true").lower() == "true"

    raw_origins = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://localhost:8000"
    )
    origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

    return Settings(
        sh_client_id=client_id,
        sh_client_secret=client_secret,
        debug=debug_flag,
        cors_origins=origins,
        demo_mode=demo_flag,
    )

