"""
Firebase Authentication & Custom Claims Verification for FastAPI
Verifies incoming Firebase Bearer ID tokens and extracts UID + authoritative roles.
"""

import os
from typing import Optional, List
from fastapi import HTTPException, Security, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from loguru import logger

try:
    import firebase_admin
    from firebase_admin import auth, credentials
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    logger.warning("firebase-admin not installed in Python environment. Running with local fallback.")

# Initialize Firebase Admin in Python if credentials are provided
if FIREBASE_AVAILABLE and not firebase_admin._apps:
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        logger.info("Initialized Firebase Admin SDK in FastAPI")
    else:
        # Default initialization (e.g. ADC or local demo)
        try:
            firebase_admin.initialize_app()
            logger.info("Initialized Firebase Admin with default credentials")
        except Exception as e:
            logger.warning(f"Firebase Admin SDK initialization skipped: {e}")

security = HTTPBearer(auto_error=False)


class AuthenticatedUser:
    def __init__(self, uid: str, email: str, role: str, is_approved: bool = True):
        self.uid = uid
        self.email = email
        self.role = role
        self.is_approved = is_approved


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> AuthenticatedUser:
    """
    FastAPI Dependency to verify Firebase ID tokens.
    Extracts authoritative custom claims: role, status.
    """
    if not credentials:
        # Demo mode bypass in development
        if os.getenv("DEMO_MODE", "true").lower() == "true":
            return AuthenticatedUser(
                uid="demo-user-uid",
                email="officer@complygem.gov.in",
                role="procurement_officer",
                is_approved=True
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization Header"
        )

    token = credentials.credentials

    # Development demo token
    if token == "demo-token" and os.getenv("DEMO_MODE", "true").lower() == "true":
        return AuthenticatedUser(
            uid="demo-user-uid",
            email="officer@complygem.gov.in",
            role="procurement_officer",
            is_approved=True
        )

    if not FIREBASE_AVAILABLE:
        return AuthenticatedUser(uid="fallback-uid", email="user@complygem.gov.in", role="procurement_officer")

    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        email = decoded_token.get("email", "")
        # Extract custom claims
        role = decoded_token.get("role", "bidder")
        user_status = decoded_token.get("status", "pending" if role in ["procurement_officer", "reviewer"] else "approved")

        if user_status != "approved" and role != "bidder" and role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is pending administrator approval"
            )

        return AuthenticatedUser(uid=uid, email=email, role=role, is_approved=True)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase authentication token"
        )


def require_roles(allowed_roles: List[str]):
    """
    Dependency factory to enforce custom claim roles on FastAPI endpoints.
    Usage: Depends(require_roles(["admin", "procurement_officer"]))
    """
    async def role_checker(user: AuthenticatedUser = Depends(get_current_user)):
        if user.role not in allowed_roles and "admin" not in user.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires one of the following roles: {allowed_roles}"
            )
        return user
    return role_checker
