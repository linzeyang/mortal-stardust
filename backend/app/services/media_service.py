"""
Media processing service for handling multimodal inputs.
Supports text, audio, image, and video processing with AI analysis.
"""

import os
import uuid
import json
import asyncio
from typing import Dict, List, Any, Optional, Union, BinaryIO
from datetime import datetime
from pathlib import Path
import logging

# Media processing libraries
from PIL import Image, ImageEnhance
try:
    import speech_recognition as sr
    SPEECH_RECOGNITION_AVAILABLE = True
except ImportError:
    SPEECH_RECOGNITION_AVAILABLE = False
    sr = None

try:
    import cv2
    import numpy as np
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False
    cv2 = None
    np = None

# For now, we'll implement basic functionality without heavy dependencies
# In production, you would install librosa, moviepy, etc.

from ..utils.encryption import encrypt_data, decrypt_data, encrypt_object, decrypt_object
from ..core.config import settings
from .file_storage import file_storage

logger = logging.getLogger(__name__)

class MediaProcessor:
    """Handles processing of different media types."""
    
    def __init__(self):
        # Use the secure file storage system
        self.file_storage = file_storage
        
        # Initialize speech recognizer if available
        if SPEECH_RECOGNITION_AVAILABLE:
            self.speech_recognizer = sr.Recognizer()
        else:
            self.speech_recognizer = None
        
        # Supported file formats
        self.supported_formats = {
            'audio': ['.mp3', '.wav', '.m4a', '.ogg', '.flac'],
            'image': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
            'video': ['.mp4', '.avi', '.mov', '.mkv', '.webm']
        }
    
    async def process_file(self, file_data: bytes, filename: str, file_type: str, user_id: str) -> Dict[str, Any]:
        """Process uploaded file and extract metadata."""
        try:
            file_extension = Path(filename).suffix.lower()
            
            # Validate file type
            if file_extension not in self.supported_formats.get(file_type, []):
                raise ValueError(f"Unsupported {file_type} format: {file_extension}")
            
            # Determine MIME type
            mime_type = self._get_mime_type(file_extension)
            
            # Store file securely with encryption
            stored_file = await self.file_storage.store_file(
                file_data=file_data,
                original_name=filename,
                mime_type=mime_type,
                user_id=user_id,
                file_type=file_type,
                encrypt=True
            )
            
            # Process file based on type (use original file data for processing)
            temp_file_path = None
            try:
                # Create temporary file for processing
                temp_file_path = Path(f"/tmp/{uuid.uuid4()}_{filename}")
                with open(temp_file_path, 'wb') as f:
                    f.write(file_data)
                
                # Process based on file type
                if file_type == 'audio':
                    metadata = await self._process_audio(temp_file_path, user_id)
                elif file_type == 'image':
                    metadata = await self._process_image(temp_file_path, user_id)
                elif file_type == 'video':
                    metadata = await self._process_video(temp_file_path, user_id)
                else:
                    raise ValueError(f"Unknown file type: {file_type}")
            finally:
                # Clean up temporary file
                if temp_file_path and temp_file_path.exists():
                    temp_file_path.unlink()
            
            # Add common metadata
            metadata.update({
                'fileId': stored_file.file_id,
                'filename': stored_file.file_id,  # Use file_id as internal filename
                'originalName': filename,
                'filePath': stored_file.stored_path,  # Encrypted path
                'fileSize': len(file_data),
                'uploadedAt': datetime.utcnow(),
                'userId': user_id,
                'fileType': file_type,
                'mimeType': mime_type,
                'isEncrypted': stored_file.is_encrypted,
                'checksum': stored_file.checksum
            })
            
            return metadata
            
        except Exception as e:
            logger.error(f"File processing failed: {e}")
            raise
    
    async def _process_audio(self, file_path: Path, user_id: str) -> Dict[str, Any]:
        """Process audio file and extract speech/metadata."""
        try:
            # Get basic file info
            file_size = file_path.stat().st_size
            
            # Estimate duration based on file size (rough approximation)
            # This is a placeholder until we have proper audio libraries
            estimated_duration = file_size / (128000 / 8)  # Assume 128kbps average
            
            # Speech-to-text conversion if available
            transcript = None
            if SPEECH_RECOGNITION_AVAILABLE:
                transcript = await self._extract_speech_to_text(file_path)
            
            metadata = {
                'duration': max(estimated_duration, 1.0),  # Minimum 1 second
                'sampleRate': 44100,  # Default assumption
                'transcript': encrypt_data(transcript) if transcript else None,
                'hasVoice': bool(transcript and len(transcript.strip()) > 0),
                'language': 'zh-CN',  # Default
                'processingNote': 'Basic audio processing - install librosa for advanced features'
            }
            
            return metadata
            
        except Exception as e:
            logger.error(f"Audio processing failed: {e}")
            return {'error': str(e), 'duration': 0}
    
    async def _process_image(self, file_path: Path, user_id: str) -> Dict[str, Any]:
        """Process image file and extract visual metadata."""
        try:
            # Load image
            with Image.open(file_path) as img:
                width, height = img.size
                format_type = img.format
                mode = img.mode
                
                # Extract EXIF data if available
                exif_data = {}
                if hasattr(img, '_getexif') and img._getexif():
                    exif_data = dict(img._getexif().items())
                
                # Basic image analysis
                # Convert to RGB if necessary
                if img.mode != 'RGB':
                    img_rgb = img.convert('RGB')
                else:
                    img_rgb = img
                
                # Calculate color distribution
                colors = img_rgb.getcolors(maxcolors=256*256*256)
                dominant_colors = self._get_dominant_colors(colors) if colors else []
                
                # Image quality assessment
                quality_score = self._assess_image_quality(img_rgb)
                
                # Detect if image contains faces (basic implementation)
                has_faces = await self._detect_faces(file_path)
                
                metadata = {
                    'dimensions': {'width': width, 'height': height},
                    'format': format_type,
                    'colorMode': mode,
                    'dominantColors': dominant_colors,
                    'qualityScore': quality_score,
                    'hasFaces': has_faces,
                    'exifData': encrypt_object(exif_data) if exif_data else None,
                    'analysisTimestamp': datetime.utcnow()
                }
                
                return metadata
                
        except Exception as e:
            logger.error(f"Image processing failed: {e}")
            return {'error': str(e)}
    
    async def _process_video(self, file_path: Path, user_id: str) -> Dict[str, Any]:
        """Process video file and extract audio/visual metadata."""
        try:
            # Basic video processing without moviepy
            file_size = file_path.stat().st_size
            
            # Estimate basic properties
            # This is a placeholder - in production you'd use ffprobe or moviepy
            estimated_duration = file_size / (5 * 1024 * 1024)  # Rough estimate: 5MB per minute
            
            metadata = {
                'duration': max(estimated_duration, 1.0),
                'fps': 30,  # Default assumption
                'resolution': {'width': 1920, 'height': 1080},  # Default assumption
                'hasAudio': True,  # Assume videos have audio
                'fileCodec': 'unknown',
                'processingNote': 'Basic video processing - install moviepy for advanced features',
                'estimatedOnly': True
            }
            
            return metadata
                
        except Exception as e:
            logger.error(f"Video processing failed: {e}")
            return {'error': str(e)}
    
    async def _extract_speech_to_text(self, audio_path: Path) -> Optional[str]:
        """Extract speech to text from audio file."""
        if not SPEECH_RECOGNITION_AVAILABLE or not self.speech_recognizer:
            return None
            
        try:
            with sr.AudioFile(str(audio_path)) as source:
                # Adjust for ambient noise
                self.speech_recognizer.adjust_for_ambient_noise(source)
                audio_data = self.speech_recognizer.record(source)
                
                # Use Google Speech Recognition (free tier)
                text = self.speech_recognizer.recognize_google(
                    audio_data, 
                    language='zh-CN'  # Chinese support
                )
                
                return text
                
        except sr.UnknownValueError:
            logger.info("Speech recognition could not understand audio")
            return None
        except sr.RequestError as e:
            logger.error(f"Speech recognition service error: {e}")
            return None
        except Exception as e:
            logger.error(f"Speech-to-text conversion failed: {e}")
            return None
    
    def _analyze_audio_emotion(self, audio_data, sample_rate: int) -> Dict[str, float]:
        """Basic emotion analysis from audio features."""
        # Placeholder implementation - would need librosa for real analysis
        return {
            'energy': 0.5,  # Default neutral values
            'pitch': 0.5,
            'intensity': 0.5,
            'note': 'Install librosa for advanced audio emotion analysis'
        }
    
    def _get_dominant_colors(self, colors: List, top_n: int = 5) -> List[Dict[str, Any]]:
        """Extract dominant colors from image."""
        try:
            # Sort colors by frequency
            sorted_colors = sorted(colors, key=lambda x: x[0], reverse=True)
            
            dominant = []
            for count, color in sorted_colors[:top_n]:
                if isinstance(color, int):
                    # Grayscale
                    rgb = (color, color, color)
                else:
                    rgb = color
                
                dominant.append({
                    'rgb': rgb,
                    'hex': '#{:02x}{:02x}{:02x}'.format(*rgb),
                    'frequency': count
                })
            
            return dominant
            
        except Exception as e:
            logger.error(f"Color extraction failed: {e}")
            return []
    
    def _assess_image_quality(self, img: Image.Image) -> float:
        """Basic image quality assessment."""
        try:
            if OPENCV_AVAILABLE and np:
                # Convert to numpy array
                img_array = np.array(img)
                
                # Calculate sharpness using Laplacian variance
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
                laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
                
                # Normalize to 0-1 scale
                quality_score = min(laplacian_var / 1000, 1.0)
                
                return float(quality_score)
            else:
                # Basic quality assessment based on image size and format
                width, height = img.size
                pixel_count = width * height
                quality_score = min(pixel_count / (1920 * 1080), 1.0)  # Normalize to HD
                return quality_score
            
        except Exception as e:
            logger.error(f"Image quality assessment failed: {e}")
            return 0.5  # Default medium quality
    
    async def _detect_faces(self, image_path: Path) -> bool:
        """Basic face detection in images."""
        try:
            if OPENCV_AVAILABLE:
                # Load OpenCV's face cascade classifier
                face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
                
                # Read image
                img = cv2.imread(str(image_path))
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                
                # Detect faces
                faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
                
                return len(faces) > 0
            else:
                # Placeholder - can't detect faces without OpenCV
                return False
            
        except Exception as e:
            logger.error(f"Face detection failed: {e}")
            return False
    
    async def _extract_key_frames(self, video_clip, num_frames: int = 5) -> List[Dict[str, Any]]:
        """Extract key frames from video for analysis."""
        # Placeholder - would need moviepy for real implementation
        return [{
            'timestamp': i * 10,  # Every 10 seconds
            'dominantColors': [],
            'brightness': 0.5,
            'note': 'Install moviepy for key frame extraction'
        } for i in range(num_frames)]
    
    def _assess_video_quality(self, video_clip) -> Dict[str, Any]:
        """Basic video quality assessment."""
        # Placeholder quality assessment
        return {
            'sharpness': 0.7,
            'resolution_score': 0.8,
            'fps_score': 0.9,
            'note': 'Estimated quality scores - install moviepy for accurate assessment'
        }
    
    def _get_mime_type(self, file_extension: str) -> str:
        """Get MIME type based on file extension."""
        mime_types = {
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.m4a': 'audio/mp4',
            '.ogg': 'audio/ogg',
            '.flac': 'audio/flac',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.bmp': 'image/bmp',
            '.webp': 'image/webp',
            '.mp4': 'video/mp4',
            '.avi': 'video/x-msvideo',
            '.mov': 'video/quicktime',
            '.mkv': 'video/x-matroska',
            '.webm': 'video/webm'
        }
        
        return mime_types.get(file_extension.lower(), 'application/octet-stream')
    
    async def delete_file(self, file_path: str) -> bool:
        """Securely delete a media file."""
        try:
            path = Path(file_path)
            if path.exists():
                path.unlink()
                return True
            return False
        except Exception as e:
            logger.error(f"File deletion failed: {e}")
            return False

# Global media processor instance
media_processor = MediaProcessor()