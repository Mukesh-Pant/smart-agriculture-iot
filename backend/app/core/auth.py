# =============================================================
# app/core/auth.py — Backend JWT verification + device access
#
# Verifies the `backend_token` JWT issued by the NodeJS service. The token
# is HS256-signed with the shared TOKEN_SECRET_KEY, so we can validate it
# here using only the Python standard library (no extra dependency).
#
# Purpose: enforce per-device data access (RBAC). A "farmer" may only read
# data for the device(s) an admin/owner has assigned to them. Owners and
# admins may read any device's data.
# =============================================================

import base64
import hashlib
import hmac
import json
import time
from typing import Optional

from fastapi import Cookie, Header, HTTPException

from app.core.settings import settings


def _b64url_decode(segment: str) -> bytes:
    padding = "=" * (-len(segment) % 4)
    return base64.urlsafe_b64decode(segment + padding)


def _verify_jwt(token: str) -> dict:
    """
    Verify an HS256 JWT against TOKEN_SECRET_KEY and return its claims.
    Raises HTTPException(401) on any failure.
    """
    secret = settings.TOKEN_SECRET_KEY
    if not secret:
        # Misconfiguration — refuse rather than silently allowing access.
        raise HTTPException(status_code=503, detail="Auth not configured on server.")

    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
    except ValueError:
        raise HTTPException(status_code=401, detail="Malformed authentication token.")

    signing_input = f"{header_b64}.{payload_b64}".encode()
    expected_sig = hmac.new(
        secret.encode(), signing_input, hashlib.sha256
    ).digest()

    try:
        provided_sig = _b64url_decode(signature_b64)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token signature.")

    if not hmac.compare_digest(expected_sig, provided_sig):
        raise HTTPException(status_code=401, detail="Invalid token signature.")

    try:
        claims = json.loads(_b64url_decode(payload_b64))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token payload.")

    # Expiry check (exp is a unix timestamp, as set by jsonwebtoken).
    exp = claims.get("exp")
    if exp is not None and time.time() > float(exp):
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")

    return claims


class CurrentUser:
    """Authenticated user claims derived from the backend JWT."""

    def __init__(self, claims: dict):
        self.id: str = claims.get("id", "")
        self.email: str = claims.get("email", "")
        self.role: str = claims.get("user_role", "farmer")
        self.status: str = claims.get("status", "")
        self.device_id: Optional[str] = claims.get("device_id")
        devices = claims.get("devices") or []
        if isinstance(devices, str):
            devices = [devices]
        # Union of the single device_id + devices array, de-duplicated.
        all_devices = set(d for d in devices if d)
        if self.device_id:
            all_devices.add(self.device_id)
        self.devices: list[str] = sorted(all_devices)

    @property
    def is_privileged(self) -> bool:
        return self.role in ("owner", "admin")


def get_current_user(
    backend_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
) -> CurrentUser:
    """
    FastAPI dependency: require a valid backend_token (cookie or
    Authorization: Bearer header). Returns the authenticated user.
    """
    token = backend_token
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization[7:]

    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")

    return CurrentUser(_verify_jwt(token))


def resolve_device_scope(user: CurrentUser, requested_device_id: Optional[str]) -> Optional[str]:
    """
    Decide which device_id a request is allowed to read.

    - Owner / admin: may read any device. If they request a specific one,
      honour it; otherwise None = all devices.
    - Farmer: restricted to assigned devices.
        * no device assigned          → 403 (no access at all)
        * requested device not theirs  → 403
        * requested device is theirs   → that device
        * no specific request          → their (first) device
    """
    if user.is_privileged:
        return requested_device_id  # None = all devices

    if not user.devices:
        raise HTTPException(
            status_code=403,
            detail="No device is assigned to your account. Contact an administrator.",
        )

    if requested_device_id:
        if requested_device_id not in user.devices:
            raise HTTPException(
                status_code=403,
                detail="You do not have access to this device's data.",
            )
        return requested_device_id

    # Default to the user's primary device.
    return user.device_id or user.devices[0]
