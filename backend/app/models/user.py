from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    WORKPLACE_NEWCOMER = "workplace_newcomer"
    ENTREPRENEUR = "entrepreneur"
    STUDENT = "student"
    OTHER = "other"

class UserProfile(BaseModel):
    firstName: str = Field(..., min_length=1, max_length=50)
    lastName: str = Field(..., min_length=1, max_length=50)
    role: UserRole
    avatar: Optional[str] = None
    phoneNumber: Optional[str] = None
    dateOfBirth: Optional[datetime] = None

class UserPreferences(BaseModel):
    language: str = "zh-CN"
    notifications: bool = True
    dataSharing: bool = False

class UserSecurity(BaseModel):
    twoFactorEnabled: bool = False
    lastLogin: datetime = Field(default_factory=datetime.utcnow)
    loginAttempts: int = 0
    lockUntil: Optional[datetime] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    firstName: str = Field(..., min_length=1, max_length=50)
    lastName: str = Field(..., min_length=1, max_length=50)
    role: UserRole

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)

class UserUpdate(BaseModel):
    firstName: Optional[str] = Field(None, min_length=1, max_length=50)
    lastName: Optional[str] = Field(None, min_length=1, max_length=50)
    role: Optional[UserRole] = None
    avatar: Optional[str] = None
    phoneNumber: Optional[str] = None
    dateOfBirth: Optional[datetime] = None
    preferences: Optional[UserPreferences] = None

class UserResponse(BaseModel):
    id: str = Field(..., alias="_id")
    email: EmailStr
    profile: UserProfile
    preferences: UserPreferences
    security: UserSecurity
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class User(BaseModel):
    """Main User model for authentication and general use."""
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    firstName: str
    lastName: str
    role: UserRole
    avatar: Optional[str] = None
    phoneNumber: Optional[str] = None
    dateOfBirth: Optional[datetime] = None
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    security: UserSecurity = Field(default_factory=UserSecurity)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    # Helper properties
    @property
    def name(self) -> str:
        return f"{self.firstName} {self.lastName}"
    
    @property
    def is_active(self) -> bool:
        """Check if user account is active (not locked)."""
        if self.security.lockUntil:
            return datetime.utcnow() > self.security.lockUntil
        return True

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class UserInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    passwordHash: str
    profile: UserProfile
    preferences: UserPreferences
    security: UserSecurity
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True