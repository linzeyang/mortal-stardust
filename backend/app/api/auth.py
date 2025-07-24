from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional

from ..models.user import UserCreate, UserLogin, UserResponse, UserInDB
from ..core.database import get_users_collection
from ..core.config import settings
from ..utils.encryption import encrypt_data, decrypt_data

router = APIRouter()
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash password."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            credentials.credentials, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    from bson import ObjectId
    users_collection = get_users_collection()
    try:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        # If ObjectId conversion fails, try with string ID
        user = await users_collection.find_one({"_id": user_id})
    if user is None:
        raise credentials_exception
    
    return user

@router.post("/register", response_model=dict)
async def register(user_data: UserCreate):
    """Register a new user."""
    users_collection = get_users_collection()
    
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user document
    user_doc = {
        "email": user_data.email,
        "passwordHash": get_password_hash(user_data.password),
        "profile": {
            "firstName": user_data.firstName,
            "lastName": user_data.lastName,
            "role": user_data.role.value,
            "avatar": None,
            "phoneNumber": None,
            "dateOfBirth": None
        },
        "preferences": {
            "language": "zh-CN",
            "notifications": True,
            "dataSharing": False
        },
        "security": {
            "twoFactorEnabled": False,
            "lastLogin": datetime.utcnow(),
            "loginAttempts": 0,
            "lockUntil": None
        },
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    # Insert user
    result = await users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create access token
    access_token_expires = timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    access_token = create_access_token(
        data={"sub": user_id, "email": user_data.email},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user_data.email,
            "firstName": user_data.firstName,
            "lastName": user_data.lastName,
            "role": user_data.role.value
        }
    }

@router.post("/login", response_model=dict)
async def login(login_data: UserLogin):
    """Login user."""
    users_collection = get_users_collection()
    
    # Find user
    user = await users_collection.find_one({"email": login_data.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(login_data.password, user["passwordHash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Update last login
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"security.lastLogin": datetime.utcnow()}}
    )
    
    # Create access token
    access_token_expires = timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    access_token = create_access_token(
        data={"sub": str(user["_id"]), "email": user["email"]},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "firstName": user["profile"]["firstName"],
            "lastName": user["profile"]["lastName"],
            "role": user["profile"]["role"]
        }
    }

@router.get("/me", response_model=dict)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information."""
    return {
        "id": str(current_user["_id"]),
        "email": current_user["email"],
        "profile": current_user["profile"],
        "preferences": current_user["preferences"],
        "security": {
            "twoFactorEnabled": current_user["security"]["twoFactorEnabled"],
            "lastLogin": current_user["security"]["lastLogin"]
        },
        "createdAt": current_user["createdAt"],
        "updatedAt": current_user["updatedAt"]
    }

@router.post("/logout")
async def logout():
    """Logout user (client-side token removal)."""
    return {"message": "Logged out successfully"}