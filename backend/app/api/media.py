"""
Media upload and processing API endpoints.
Handles multimodal file uploads (audio, image, video) with processing and encryption.
"""

from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from ..api.auth import get_current_user
from ..core.database import get_media_collection
from ..services.file_storage import file_storage
from ..services.media_service import media_processor
from ..utils.encryption import decrypt_data, encrypt_data

router = APIRouter()

# Configuration
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {
    "audio": [".mp3", ".wav", ".m4a", ".ogg", ".flac"],
    "image": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
    "video": [".mp4", ".avi", ".mov", ".mkv", ".webm"],
}


@router.post("/upload", response_model=dict)
async def upload_media_file(
    file: UploadFile = File(...),
    media_type: str = Form(...),
    description: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
):
    """Upload and process a media file."""
    try:
        # Validate file size
        if file.size and file.size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE // (1024 * 1024)}MB",
            )

        # Validate media type
        if media_type not in ["audio", "image", "video"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid media type. Must be 'audio', 'image', or 'video'",
            )

        # Validate file extension
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in ALLOWED_EXTENSIONS[media_type]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format for {media_type}: {file_extension}",
            )

        # Read file content
        file_content = await file.read()

        # Process the file
        processing_result = await media_processor.process_file(
            file_data=file_content,
            filename=file.filename,
            file_type=media_type,
            user_id=str(current_user["_id"]),
        )

        # Create media document for database
        media_doc = {
            "userId": str(current_user["_id"]),
            "filename": processing_result["filename"],
            "originalName": processing_result["originalName"],
            "mediaType": media_type,
            "mimeType": processing_result["mimeType"],
            "fileSize": processing_result["fileSize"],
            "filePath": encrypt_data(
                processing_result["filePath"]
            ),  # Encrypt file path
            "description": encrypt_data(description) if description else None,
            "metadata": processing_result,
            "uploadedAt": datetime.utcnow(),
            "isActive": True,
        }

        # Store in database
        media_collection = get_media_collection()
        result = await media_collection.insert_one(media_doc)

        return {
            "id": str(result.inserted_id),
            "filename": processing_result["filename"],
            "mediaType": media_type,
            "fileSize": processing_result["fileSize"],
            "metadata": {
                "duration": processing_result.get("duration"),
                "dimensions": processing_result.get("dimensions"),
                "hasTranscript": bool(processing_result.get("transcript")),
                "processingNote": processing_result.get("processingNote"),
            },
            "message": "File uploaded and processed successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload failed: {str(e)}",
        )


@router.get("/files", response_model=List[dict])
async def get_user_media_files(
    media_type: Optional[str] = None,
    limit: int = 20,
    skip: int = 0,
    current_user: dict = Depends(get_current_user),
):
    """Get user's uploaded media files."""
    try:
        media_collection = get_media_collection()

        # Build query
        query = {"userId": str(current_user["_id"]), "isActive": True}

        if media_type:
            query["mediaType"] = media_type

        # Fetch files
        cursor = (
            media_collection.find(query).sort("uploadedAt", -1).skip(skip).limit(limit)
        )

        files = []
        async for media_file in cursor:
            # Decrypt sensitive data
            file_info = {
                "id": str(media_file["_id"]),
                "filename": media_file["filename"],
                "originalName": media_file["originalName"],
                "mediaType": media_file["mediaType"],
                "mimeType": media_file["mimeType"],
                "fileSize": media_file["fileSize"],
                "description": (
                    decrypt_data(media_file["description"])
                    if media_file.get("description")
                    else None
                ),
                "uploadedAt": media_file["uploadedAt"],
                "metadata": {
                    "duration": media_file["metadata"].get("duration"),
                    "dimensions": media_file["metadata"].get("dimensions"),
                    "hasTranscript": bool(media_file["metadata"].get("transcript")),
                    "processingNote": media_file["metadata"].get("processingNote"),
                },
            }
            files.append(file_info)

        return files

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve media files: {str(e)}",
        )


@router.get("/files/{file_id}", response_model=dict)
async def get_media_file_details(
    file_id: str, current_user: dict = Depends(get_current_user)
):
    """Get detailed information about a specific media file."""
    try:
        media_collection = get_media_collection()

        media_file = await media_collection.find_one(
            {"_id": file_id, "userId": str(current_user["_id"]), "isActive": True}
        )

        if not media_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Media file not found"
            )

        # Decrypt sensitive data for detailed view
        file_details = {
            "id": str(media_file["_id"]),
            "filename": media_file["filename"],
            "originalName": media_file["originalName"],
            "mediaType": media_file["mediaType"],
            "mimeType": media_file["mimeType"],
            "fileSize": media_file["fileSize"],
            "description": (
                decrypt_data(media_file["description"])
                if media_file.get("description")
                else None
            ),
            "uploadedAt": media_file["uploadedAt"],
            "metadata": media_file["metadata"],
            "transcript": (
                decrypt_data(media_file["metadata"].get("transcript"))
                if media_file["metadata"].get("transcript")
                else None
            ),
        }

        return file_details

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve media file details: {str(e)}",
        )


@router.get("/files/{file_id}/download")
async def download_media_file(
    file_id: str, current_user: dict = Depends(get_current_user)
):
    """Download a media file."""
    try:
        media_collection = get_media_collection()

        media_file = await media_collection.find_one(
            {"_id": file_id, "userId": str(current_user["_id"]), "isActive": True}
        )

        if not media_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Media file not found"
            )

        # Decrypt file path
        file_path = decrypt_data(media_file["filePath"])
        file_path_obj = Path(file_path)

        if not file_path_obj.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Physical file not found"
            )

        return FileResponse(
            path=str(file_path_obj),
            filename=media_file["originalName"],
            media_type=media_file["mimeType"],
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File download failed: {str(e)}",
        )


@router.delete("/files/{file_id}", response_model=dict)
async def delete_media_file(
    file_id: str, current_user: dict = Depends(get_current_user)
):
    """Delete a media file."""
    try:
        media_collection = get_media_collection()

        media_file = await media_collection.find_one(
            {"_id": file_id, "userId": str(current_user["_id"]), "isActive": True}
        )

        if not media_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Media file not found"
            )

        # Decrypt file path and delete physical file
        file_path = decrypt_data(media_file["filePath"])
        await media_processor.delete_file(file_path)

        # Mark as deleted in database (soft delete)
        await media_collection.update_one(
            {"_id": file_id},
            {"$set": {"isActive": False, "deletedAt": datetime.utcnow()}},
        )

        return {"message": "Media file deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File deletion failed: {str(e)}",
        )


@router.post("/files/{file_id}/transcript", response_model=dict)
async def regenerate_transcript(
    file_id: str, current_user: dict = Depends(get_current_user)
):
    """Regenerate transcript for an audio/video file."""
    try:
        media_collection = get_media_collection()

        media_file = await media_collection.find_one(
            {"_id": file_id, "userId": str(current_user["_id"]), "isActive": True}
        )

        if not media_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Media file not found"
            )

        if media_file["mediaType"] not in ["audio", "video"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transcript can only be generated for audio/video files",
            )

        # Decrypt file path and regenerate transcript
        file_path = decrypt_data(media_file["filePath"])
        file_path_obj = Path(file_path)

        if not file_path_obj.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Physical file not found"
            )

        # Regenerate transcript
        transcript = await media_processor._extract_speech_to_text(file_path_obj)

        # Update database
        update_data = {
            "metadata.transcript": encrypt_data(transcript) if transcript else None,
            "metadata.hasVoice": bool(transcript and len(transcript.strip()) > 0),
            "metadata.transcriptUpdatedAt": datetime.utcnow(),
        }

        await media_collection.update_one({"_id": file_id}, {"$set": update_data})

        return {
            "message": "Transcript regenerated successfully",
            "hasTranscript": bool(transcript),
            "transcript": transcript if transcript else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcript regeneration failed: {str(e)}",
        )


@router.get("/stats", response_model=dict)
async def get_media_stats(current_user: dict = Depends(get_current_user)):
    """Get user's media upload statistics."""
    try:
        media_collection = get_media_collection()

        # Aggregate statistics
        pipeline = [
            {"$match": {"userId": str(current_user["_id"]), "isActive": True}},
            {
                "$group": {
                    "_id": "$mediaType",
                    "count": {"$sum": 1},
                    "totalSize": {"$sum": "$fileSize"},
                    "avgSize": {"$avg": "$fileSize"},
                }
            },
        ]

        stats = {}
        async for result in media_collection.aggregate(pipeline):
            media_type = result["_id"]
            stats[media_type] = {
                "count": result["count"],
                "totalSize": result["totalSize"],
                "avgSize": result["avgSize"],
            }

        # Calculate totals
        total_files = sum(stat["count"] for stat in stats.values())
        total_storage = sum(stat["totalSize"] for stat in stats.values())

        return {
            "totalFiles": total_files,
            "totalStorage": total_storage,
            "byType": stats,
            "storageLimit": MAX_FILE_SIZE * 100,  # Example: 100 files max
            "generatedAt": datetime.utcnow(),
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve media statistics: {str(e)}",
        )


@router.get("/storage/stats", response_model=dict)
async def get_storage_statistics(current_user: dict = Depends(get_current_user)):
    """Get file storage statistics for the current user."""
    try:
        stats = await file_storage.get_storage_stats(user_id=str(current_user["_id"]))
        return {"userId": str(current_user["_id"]), "stats": stats}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get storage statistics: {str(e)}",
        )


@router.post("/storage/cleanup", response_model=dict)
async def cleanup_storage(current_user: dict = Depends(get_current_user)):
    """Clean up temporary and orphaned files."""
    try:
        cleanup_count = await file_storage.cleanup_temp_files()

        return {"message": "Storage cleanup completed", "filesRemoved": cleanup_count}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Storage cleanup failed: {str(e)}",
        )


@router.get("/storage/files", response_model=List[dict])
async def list_stored_files(
    file_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(get_current_user),
):
    """List files in secure storage for the current user."""
    try:
        stored_files = await file_storage.list_user_files(
            user_id=str(current_user["_id"]),
            file_type=file_type,
            limit=limit,
            offset=offset,
        )

        # Convert to response format
        files_response = []
        for stored_file in stored_files:
            files_response.append(
                {
                    "id": stored_file.file_id,
                    "originalName": stored_file.original_name,
                    "fileSize": stored_file.file_size,
                    "mimeType": stored_file.mime_type,
                    "createdAt": stored_file.created_at,
                    "isEncrypted": stored_file.is_encrypted,
                    "accessCount": stored_file.access_count,
                    "lastAccessed": stored_file.last_accessed,
                }
            )

        return files_response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list stored files: {str(e)}",
        )
