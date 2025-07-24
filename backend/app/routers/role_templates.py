"""
Role template API endpoints for managing user role templates.
Provides endpoints for listing, retrieving, and working with role-based templates.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from ..models.role_template import RoleTemplate, UserRole
from ..data.role_templates import (
    get_all_templates, 
    get_template_by_role, 
    get_template_by_id,
    TEMPLATE_REGISTRY
)
from ..dependencies import get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/role-templates", tags=["role-templates"])

@router.get("/", response_model=List[RoleTemplate])
async def list_templates(
    role: Optional[UserRole] = None,
    current_user: User = Depends(get_current_user)
):
    """
    List all available role templates or filter by role.
    
    - **role**: Optional role filter (workplace_newcomer, entrepreneur, student, other)
    - Returns list of role templates with all sections and fields
    """
    try:
        if role:
            template = get_template_by_role(role)
            if not template:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No template found for role: {role}"
                )
            return [template]
        
        return get_all_templates()
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve templates: {str(e)}"
        )

@router.get("/{template_id}", response_model=RoleTemplate)
async def get_template(
    template_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific role template by ID.
    
    - **template_id**: The unique identifier of the template
    - Returns the complete template with all sections and fields
    """
    try:
        template = get_template_by_id(template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template not found: {template_id}"
            )
        
        return template
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve template: {str(e)}"
        )

@router.get("/by-role/{role}", response_model=RoleTemplate)
async def get_template_by_user_role(
    role: UserRole,
    current_user: User = Depends(get_current_user)
):
    """
    Get role template by user role.
    
    - **role**: The user role (workplace_newcomer, entrepreneur, student, other)
    - Returns the template specific to that role
    """
    try:
        template = get_template_by_role(role)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No template available for role: {role}"
            )
        
        return template
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve template for role {role}: {str(e)}"
        )

@router.get("/roles/available", response_model=List[dict])
async def get_available_roles(
    current_user: User = Depends(get_current_user)
):
    """
    Get list of available user roles with their display information.
    
    Returns basic information about each role for selection purposes.
    """
    try:
        roles_info = []
        for role, template in TEMPLATE_REGISTRY.items():
            roles_info.append({
                "role": role,
                "name": template.name,
                "description": template.description,
                "icon": template.icon,
                "tags": template.tags
            })
        
        return roles_info
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve available roles: {str(e)}"
        )

@router.get("/{template_id}/sections", response_model=List[dict])
async def get_template_sections(
    template_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get template sections overview (without full field details).
    
    - **template_id**: The unique identifier of the template
    - Returns simplified section information for UI navigation
    """
    try:
        template = get_template_by_id(template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template not found: {template_id}"
            )
        
        sections_overview = []
        for section in template.sections:
            sections_overview.append({
                "id": section.id,
                "title": section.title,
                "description": section.description,
                "icon": section.icon,
                "order": section.order,
                "collapsible": section.collapsible,
                "field_count": len(section.fields)
            })
        
        return sections_overview
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve template sections: {str(e)}"
        )

@router.get("/{template_id}/ai-prompts", response_model=dict)
async def get_template_ai_prompts(
    template_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get AI prompt templates for a specific role template.
    
    - **template_id**: The unique identifier of the template
    - Returns the AI prompts for all three stages
    """
    try:
        template = get_template_by_id(template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template not found: {template_id}"
            )
        
        return {
            "stage1_prompt": template.aiPrompts.stage1_prompt,
            "stage2_prompt": template.aiPrompts.stage2_prompt,
            "stage3_prompt": template.aiPrompts.stage3_prompt,
            "context_variables": template.aiPrompts.context_variables
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve AI prompts: {str(e)}"
        )

@router.post("/{template_id}/validate", response_model=dict)
async def validate_template_data(
    template_id: str,
    form_data: dict,
    current_user: User = Depends(get_current_user)
):
    """
    Validate form data against a template's field requirements.
    
    - **template_id**: The unique identifier of the template
    - **form_data**: The form data to validate
    - Returns validation results with any errors
    """
    try:
        template = get_template_by_id(template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template not found: {template_id}"
            )
        
        validation_errors = []
        
        # Validate each section and field
        for section in template.sections:
            for field in section.fields:
                field_value = form_data.get(field.id)
                
                # Check required fields
                if field.required and (field_value is None or field_value == ""):
                    validation_errors.append({
                        "field_id": field.id,
                        "section_id": section.id,
                        "error": f"Field '{field.label}' is required"
                    })
                
                # Validate field-specific rules
                if field_value is not None and field.validations:
                    for validation in field.validations:
                        if validation.type == "min_length":
                            if len(str(field_value)) < validation.value:
                                validation_errors.append({
                                    "field_id": field.id,
                                    "section_id": section.id,
                                    "error": validation.message
                                })
                        elif validation.type == "range":
                            try:
                                min_val, max_val = map(int, validation.value.split("-"))
                                if not (min_val <= int(field_value) <= max_val):
                                    validation_errors.append({
                                        "field_id": field.id,
                                        "section_id": section.id,
                                        "error": validation.message
                                    })
                            except (ValueError, AttributeError):
                                pass
        
        return {
            "valid": len(validation_errors) == 0,
            "errors": validation_errors,
            "error_count": len(validation_errors)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate template data: {str(e)}"
        )