from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from app.database import create_user, authenticate_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    role: Literal["analyst", "consumer"]
    full_name: str
    account_id: Optional[str] = None


class LoginRequest(BaseModel):
    identifier: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    full_name: str
    account_id: Optional[str] = None


class AuthResponse(BaseModel):
    success: bool
    user: Optional[UserResponse] = None
    message: str


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest):
    if len(payload.username.strip()) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if len(payload.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    try:
        user = create_user(
            username=payload.username,
            email=payload.email,
            password=payload.password,
            role=payload.role,
            full_name=payload.full_name,
            account_id=payload.account_id,
        )
        return AuthResponse(
            success=True,
            user=UserResponse(**user),
            message="Account successfully created",
        )
    except Exception as e:
        err_msg = str(e)
        if "UNIQUE constraint failed" in err_msg:
            raise HTTPException(status_code=400, detail="Username or email already registered")
        raise HTTPException(status_code=500, detail=f"Database error: {err_msg}")


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest):
    user = authenticate_user(payload.identifier, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username/email or password")

    return AuthResponse(
        success=True,
        user=UserResponse(**user),
        message="Login successful",
    )
