"""
Sentinel Hub authentication — OAuth2 client credentials flow.
Token is fetched once per request cycle and cached in memory.
Credentials are never logged or exposed in error messages.
"""

import logging
import time
from typing import Optional
import requests
from app.config import get_settings, CDSE_TOKEN_URL

logger = logging.getLogger(__name__)

# In-memory token cache (avoids fetching a new token on every request)
_token_cache: dict = {"access_token": None, "expires_at": 0.0}


class AuthError(Exception):
    """Raised when authentication fails for any reason."""


def _credentials_configured() -> bool:
    s = get_settings()
    return bool(s.sh_client_id and s.sh_client_secret)


def get_access_token(force_refresh: bool = False) -> str:
    """
    Return a valid OAuth2 Bearer token.
    Raises AuthError if credentials are missing or the token endpoint fails.
    Does NOT expose credential values in exception messages.
    """
    if not _credentials_configured():
        raise AuthError(
            "Copernicus credentials not configured. "
            "Set SH_CLIENT_ID and SH_CLIENT_SECRET environment variables "
            "in your server-side Secrets interface."
        )

    now = time.time()
    if (
        not force_refresh
        and _token_cache["access_token"]
        and now < _token_cache["expires_at"] - 30  # 30 s buffer
    ):
        return _token_cache["access_token"]

    settings = get_settings()
    try:
        resp = requests.post(
            CDSE_TOKEN_URL,
            data={
                "grant_type": "client_credentials",
                "client_id": settings.sh_client_id,
                "client_secret": settings.sh_client_secret,
            },
            timeout=settings.auth_timeout,
        )
    except requests.Timeout:
        raise AuthError("Authentication request timed out. Please try again.")
    except requests.ConnectionError:
        raise AuthError(
            "Cannot reach the Copernicus authentication server. "
            "Check your network connection."
        )

    if resp.status_code == 400:
        raise AuthError(
            "Authentication failed: invalid credentials. "
            "Verify SH_CLIENT_ID and SH_CLIENT_SECRET are correct."
        )
    if resp.status_code == 401:
        raise AuthError(
            "Authentication failed: unauthorised. "
            "Check that your Copernicus account is active."
        )
    if not resp.ok:
        raise AuthError(
            f"Authentication failed with HTTP {resp.status_code}. "
            "Please retry or check Copernicus service status."
        )

    payload = resp.json()
    access_token: Optional[str] = payload.get("access_token")
    expires_in: int = int(payload.get("expires_in", 600))

    if not access_token:
        raise AuthError("Token endpoint returned no access_token field.")

    _token_cache["access_token"] = access_token
    _token_cache["expires_at"] = now + expires_in
    logger.info("Obtained new Copernicus access token (expires in %ss).", expires_in)
    return access_token


def credentials_present() -> bool:
    """Quick check for health endpoint — does not attempt a network call."""
    return _credentials_configured()
