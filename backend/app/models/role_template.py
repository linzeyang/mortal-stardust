"""
Role Template models for structured user experience input.
Provides templates for different user roles (workplace newcomer, entrepreneur, student).
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    WORKPLACE_NEWCOMER = "workplace_newcomer"
    ENTREPRENEUR = "entrepreneur"
    STUDENT = "student"
    OTHER = "other"

class InputFieldType(str, Enum):
    TEXT = "text"
    TEXTAREA = "textarea"
    SELECT = "select"
    MULTISELECT = "multiselect"
    NUMBER = "number"
    DATE = "date"
    SLIDER = "slider"
    BOOLEAN = "boolean"
    FILE_UPLOAD = "file_upload"

class ValidationRule(BaseModel):
    type: str = Field(..., description="Validation type (required, min_length, max_length, etc.)")
    value: Union[str, int, bool] = Field(..., description="Validation value")
    message: str = Field(..., description="Error message for validation failure")

class InputField(BaseModel):
    id: str = Field(..., description="Unique field identifier")
    label: str = Field(..., description="Display label for the field")
    type: InputFieldType = Field(..., description="Field input type")
    placeholder: Optional[str] = Field(None, description="Placeholder text")
    helpText: Optional[str] = Field(None, description="Help text for the field")
    required: bool = Field(False, description="Whether field is required")
    options: Optional[List[Dict[str, str]]] = Field(None, description="Options for select/multiselect fields")
    validations: Optional[List[ValidationRule]] = Field(None, description="Field validation rules")
    defaultValue: Optional[Union[str, int, bool, List]] = Field(None, description="Default field value")
    conditional: Optional[Dict[str, Any]] = Field(None, description="Conditional display logic")

class TemplateSection(BaseModel):
    id: str = Field(..., description="Section identifier")
    title: str = Field(..., description="Section title")
    description: Optional[str] = Field(None, description="Section description")
    icon: Optional[str] = Field(None, description="Section icon name")
    order: int = Field(..., description="Display order")
    fields: List[InputField] = Field(..., description="Fields in this section")
    collapsible: bool = Field(False, description="Whether section can be collapsed")

class AIPromptTemplate(BaseModel):
    stage1_prompt: str = Field(..., description="Psychological healing stage prompt template")
    stage2_prompt: str = Field(..., description="Practical solution stage prompt template")
    stage3_prompt: str = Field(..., description="Follow-up stage prompt template")
    context_variables: List[str] = Field(..., description="Variables to substitute in prompts")

class RoleTemplate(BaseModel):
    id: str = Field(..., description="Template identifier")
    role: UserRole = Field(..., description="User role this template is for")
    name: str = Field(..., description="Template display name")
    description: str = Field(..., description="Template description")
    icon: str = Field(..., description="Template icon")
    sections: List[TemplateSection] = Field(..., description="Template sections")
    aiPrompts: AIPromptTemplate = Field(..., description="AI processing prompts for this role")
    tags: List[str] = Field(default_factory=list, description="Template tags")
    version: str = Field("1.0", description="Template version")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(True, description="Whether template is active")

# Request/Response models
class RoleTemplateResponse(BaseModel):
    id: str
    role: UserRole
    name: str
    description: str
    icon: str
    sections: List[TemplateSection]
    tags: List[str]
    version: str

class TemplateSelectionRequest(BaseModel):
    role: UserRole = Field(..., description="User role to get template for")
    
class ExperienceSubmissionRequest(BaseModel):
    templateId: str = Field(..., description="Template used for this experience")
    sectionData: Dict[str, Dict[str, Any]] = Field(..., description="Data organized by section")
    mediaFiles: Optional[List[str]] = Field(None, description="Media file IDs attached to this experience")
    tags: Optional[List[str]] = Field(None, description="User-added tags")

class TemplateUsageStats(BaseModel):
    templateId: str
    role: UserRole
    usageCount: int
    lastUsed: Optional[datetime]
    avgCompletionRate: float
    popularFields: List[str]