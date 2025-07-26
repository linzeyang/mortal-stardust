"""Experience models for user life event capture and AI processing pipeline.

This module defines all models related to user experiences - the core data structure
that captures user life events, emotions, and context for AI-powered guidance generation.
Experiences flow through a three-stage processing pipeline that provides psychological
healing, practical solutions, and follow-up support.

The experience system supports multi-modal input (text, audio, video, images) and
maintains comprehensive metadata for personalized AI processing while ensuring
privacy and security through field-level encryption.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class MediaType(str, Enum):
    """Supported media file types for multi-modal experience input.

    Defines the types of media files users can attach to their experiences
    to provide richer context for AI processing. Each type requires different
    processing approaches and metadata extraction.

    Values:
        AUDIO: Voice recordings, audio notes, or ambient sound captures.
            Processed for speech-to-text transcription and emotional tone analysis.
        IMAGE: Photos, screenshots, or visual documentation of experiences.
            Processed for object recognition, scene analysis, and emotional context.
        VIDEO: Video recordings combining visual and audio information.
            Processed for both visual analysis and audio transcription.
    """

    AUDIO = "audio"
    IMAGE = "image"
    VIDEO = "video"


class ExperienceCategory(str, Enum):
    """Experience categorization for AI processing specialization and analytics.

    Categories help the AI system apply domain-specific knowledge and templates
    for more relevant guidance generation. Each category has associated prompt
    engineering and solution approaches tailored to common challenges in that area.

    Values:
        CAREER: Work-related experiences, job challenges, professional development.
            AI focuses on career guidance, skill development, and workplace dynamics.
        RELATIONSHIP: Interpersonal relationships, family dynamics, social interactions.
            AI emphasizes communication skills, emotional intelligence, and conflict resolution.
        EDUCATION: Academic challenges, learning difficulties, educational decisions.
            AI provides study strategies, academic planning, and learning optimization.
        HEALTH: Physical and mental health experiences, wellness challenges.
            AI offers wellness guidance while avoiding medical diagnosis or treatment.
        FINANCE: Money management, financial decisions, economic challenges.
            AI provides financial literacy, budgeting advice, and economic planning.
        PERSONAL_GROWTH: Self-improvement, life goals, personal development.
            AI focuses on goal setting, habit formation, and personal transformation.
        OTHER: Experiences that don't fit specific categories.
            AI applies general life guidance and emotional support approaches.
    """

    CAREER = "career"
    RELATIONSHIP = "relationship"
    EDUCATION = "education"
    HEALTH = "health"
    FINANCE = "finance"
    PERSONAL_GROWTH = "personal_growth"
    OTHER = "other"


class EmotionalState(str, Enum):
    """User emotional states for experience context and AI response customization.

    Emotional state influences AI response tone, approach, and priority focus areas.
    The AI adapts its communication style and solution recommendations based on
    the user's emotional context to provide appropriate support and guidance.

    Values:
        HAPPY: Positive emotional state, celebratory or joyful experiences.
            AI focuses on reinforcement, growth opportunities, and sharing success.
        SAD: Melancholic or sorrowful emotional state, loss or disappointment.
            AI emphasizes empathy, emotional validation, and gentle guidance.
        ANGRY: Frustrated or irritated emotional state, conflict or injustice.
            AI provides anger management, perspective-taking, and constructive action.
        ANXIOUS: Worried or nervous emotional state, uncertainty or fear.
            AI offers anxiety management, reassurance, and practical coping strategies.
        CONFUSED: Uncertain or perplexed emotional state, decision paralysis.
            AI provides clarity, structured thinking, and decision-making frameworks.
        EXCITED: Enthusiastic or energetic emotional state, anticipation or motivation.
            AI channels energy productively and helps maintain sustainable momentum.
        PEACEFUL: Calm or serene emotional state, contentment or reflection.
            AI supports mindfulness, gratitude practices, and continued growth.
        FRUSTRATED: Blocked or impeded emotional state, obstacles or setbacks.
            AI offers problem-solving strategies, persistence techniques, and alternative approaches.
    """

    HAPPY = "happy"
    SAD = "sad"
    ANGRY = "angry"
    ANXIOUS = "anxious"
    CONFUSED = "confused"
    EXCITED = "excited"
    PEACEFUL = "peaceful"
    FRUSTRATED = "frustrated"


class InputMethod(str, Enum):
    """Methods used for experience input to optimize processing and user experience.

    Input method affects how the experience is processed, what additional context
    is available, and how the AI should interpret and respond to the content.
    This information helps optimize the user interface and processing pipeline.

    Values:
        TEXT: Typed text input through web interface or mobile app.
            Standard processing with text analysis and natural language understanding.
        VOICE: Voice recording input requiring speech-to-text processing.
            Additional emotional tone analysis and speech pattern recognition.
        MIXED: Combination of text, voice, and media inputs.
            Comprehensive multi-modal processing with content correlation.
    """

    TEXT = "text"
    VOICE = "voice"
    MIXED = "mixed"


class ProcessingStage(str, Enum):
    """AI processing pipeline stages for experience analysis and solution generation.

    Represents the current stage of AI processing for an experience. The three-stage
    pipeline ensures comprehensive support from initial emotional validation through
    practical solutions to ongoing follow-up support.

    Values:
        PENDING: Experience submitted but not yet processed by AI.
            Initial state before any AI analysis begins.
        STAGE1: Psychological healing and emotional support phase.
            AI provides empathy, validation, and emotional processing guidance.
        STAGE2: Practical solution generation and action planning phase.
            AI generates specific recommendations and actionable steps.
        STAGE3: Follow-up support and experience supplementation phase.
            AI provides ongoing guidance and helps track progress.
        COMPLETED: All processing stages finished successfully.
            Experience has received comprehensive AI support and guidance.
    """

    PENDING = "pending"
    STAGE1 = "stage1"
    STAGE2 = "stage2"
    STAGE3 = "stage3"
    COMPLETED = "completed"


class MediaFile(BaseModel):
    """Media file attachment for multi-modal experience input.

    Represents uploaded media files (audio, image, video) attached to user experiences.
    Files are processed for content extraction, transcription, and analysis to provide
    additional context for AI guidance generation. All sensitive content is encrypted.

    Attributes:
        type: Media file type determining processing approach and capabilities.
            Affects which analysis tools and extraction methods are applied.
        filename: System-generated unique filename for storage and retrieval.
            Used for file system operations and database references.
        originalName: User's original filename for display and reference.
            Preserved for user interface display and file identification.
        url: Storage URL or path to the uploaded file (encrypted).
            Points to secure file storage location, encrypted for privacy.
        size: File size in bytes for storage management and validation.
            Used for upload limits, storage quotas, and performance optimization.
        duration: Length in seconds for audio/video files, None for images.
            Used for processing time estimation and user interface display.
        transcript: Speech-to-text transcription for audio/video content (encrypted).
            Generated automatically for voice content to enable text-based AI processing.
        description: AI-generated description of visual content (encrypted).
            Provides textual representation of images/videos for AI analysis.
        metadata: Additional file metadata like resolution, format, etc. (encrypted).
            Technical information used for processing optimization and quality assessment.
    """

    type: MediaType
    filename: str
    originalName: str
    url: str  # Will be encrypted
    size: int
    duration: Optional[int] = None  # For audio/video
    transcript: Optional[str] = None  # Encrypted
    description: Optional[str] = None  # Encrypted
    metadata: Optional[Dict[str, Any]] = None  # Encrypted


class ExperienceEmotionalState(BaseModel):
    """User's emotional state during the experience for AI response customization.

    Captures both the type and intensity of emotions associated with an experience
    to help the AI provide appropriately toned and targeted guidance. Emotional
    context is crucial for effective therapeutic and supportive responses.

    Attributes:
        primary: Main emotional state during the experience.
            Determines AI response tone, approach, and priority focus areas.
        intensity: Emotional intensity level from 1 (mild) to 10 (extreme).
            Validation: Must be between 1-10 inclusive.
            Affects urgency of response and depth of emotional support provided.
        description: Optional detailed description of emotional nuances (encrypted).
            Provides additional context beyond the primary state and intensity.
            Helps AI understand complex or mixed emotional experiences.
    """

    primary: EmotionalState
    intensity: int = Field(..., ge=1, le=10)
    description: Optional[str] = None  # Encrypted


class ExperiencePrivacy(BaseModel):
    """Privacy settings controlling experience data usage and sharing.

    Manages user consent for different levels of data usage, from AI processing
    to research participation. Ensures GDPR compliance and user control over
    their personal information while enabling platform functionality.

    Attributes:
        isPublic: Whether experience can be shared publicly (anonymized).
            Default: False to protect privacy, requires explicit user consent.
            When True, enables community features and shared learning.
        shareWithAI: Whether experience data can be used for AI processing.
            Default: True to enable core platform functionality.
            When False, limits AI analysis and guidance generation capabilities.
        anonymizeForResearch: Whether to include experience in research datasets.
            Default: False to ensure explicit opt-in for research participation.
            When True, contributes to platform improvement and academic research.
    """

    isPublic: bool = False
    shareWithAI: bool = True
    anonymizeForResearch: bool = False


class ExperienceMetadata(BaseModel):
    """Contextual metadata about the experience for processing optimization.

    Contains technical and contextual information about how and when the experience
    was captured. This metadata helps the AI understand the context and optimize
    processing approaches while tracking the experience through the pipeline.

    Attributes:
        location: Optional location where experience occurred (encrypted).
            Provides geographical context for culturally-aware guidance.
            Encrypted to protect user privacy and location data.
        dateOccurred: When the actual experience happened (not when recorded).
            Used for temporal context and relevance assessment in AI processing.
            Helps distinguish between recent events and historical reflections.
        inputMethod: How the user provided the experience information.
            Default: TEXT for standard web interface input.
            Affects processing approach and available analysis techniques.
        processingStage: Current stage in the AI processing pipeline.
            Default: PENDING for newly created experiences.
            Tracks progress through the three-stage AI guidance system.
    """

    location: Optional[str] = None  # Encrypted
    dateOccurred: datetime
    inputMethod: InputMethod = InputMethod.TEXT
    processingStage: ProcessingStage = ProcessingStage.PENDING


class ExperienceContent(BaseModel):
    """Core content of the user experience including text and media attachments.

    Contains the actual experience data provided by the user, including both
    textual descriptions and any attached media files. All content is encrypted
    to protect user privacy while enabling AI processing and analysis.

    Attributes:
        text: User's textual description of the experience (encrypted).
            Primary content for AI analysis and natural language processing.
            Contains the narrative, emotions, and context of the experience.
        mediaFiles: List of attached media files providing additional context.
            Default: Empty list for text-only experiences.
            Supports multi-modal input for richer AI understanding and analysis.
    """

    text: str  # Encrypted
    mediaFiles: List[MediaFile] = []


class ExperienceCreate(BaseModel):
    """Request model for creating new user experiences.

    Validates and structures all required information for creating a new experience
    entry. Ensures data quality and completeness before AI processing begins while
    providing sensible defaults for optional fields.

    Attributes:
        title: Brief descriptive title for the experience.
            Validation: 1-200 characters, required for experience identification.
            Used in user interface lists and experience management.
        content: Core experience content including text and media attachments.
            Contains the actual experience data for AI analysis and processing.
        role: User's role or identity during the experience.
            Default: Other for general experiences.
            Used for personalized AI responses and contextualization.
        category: Experience category for specialized AI processing.
            Determines which domain-specific knowledge and templates are applied.
        emotionalState: User's emotional context during the experience.
            Critical for AI response tone and therapeutic approach selection.
        tags: Optional user-defined tags for organization and search.
            Default: Empty list, allows user categorization and filtering.
        privacy: Privacy settings controlling data usage and sharing.
            Default: Standard privacy settings with AI processing enabled.
        metadata: Contextual information about the experience capture.
            Includes timing, location, and input method for processing optimization.
    """

    title: str = Field(..., min_length=1, max_length=200)
    content: ExperienceContent
    role: Literal["workplace_newcomer", "entrepreneur", "student", "other"] = Field(...)
    category: ExperienceCategory
    emotionalState: ExperienceEmotionalState
    tags: List[str] = []
    privacy: ExperiencePrivacy = ExperiencePrivacy()
    metadata: ExperienceMetadata


class ExperienceUpdate(BaseModel):
    """Request model for updating existing experiences.

    Allows partial updates to experience information while maintaining data
    validation. All fields are optional to support granular modifications
    without requiring complete experience reconstruction.

    Attributes:
        title: Updated experience title, maintains same validation as creation.
            Validation: 1-200 characters when provided, None to skip update.
        content: Updated experience content including text and media.
            Can modify text description or add/remove media attachments.
        category: Updated experience category, triggers AI processing reconfiguration.
            When changed, may affect existing solutions and recommendations.
        emotionalState: Updated emotional context for the experience.
            Can reflect changed perspective or additional emotional processing.
        tags: Updated tag list for organization and search.
            Can add, remove, or completely replace existing tags.
        privacy: Updated privacy settings for data usage control.
            Can modify sharing permissions and research participation.
        metadata: Updated contextual metadata about the experience.
            Can correct timing, location, or processing stage information.
    """

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[ExperienceContent] = None
    category: Optional[ExperienceCategory] = None
    emotionalState: Optional[ExperienceEmotionalState] = None
    tags: Optional[List[str]] = None
    privacy: Optional[ExperiencePrivacy] = None
    metadata: Optional[ExperienceMetadata] = None


class ExperienceResponse(BaseModel):
    """Response model for experience data in API endpoints.

    Structures experience data for safe transmission to client applications,
    including all necessary information for user interface rendering and
    experience management while maintaining proper data formatting.

    Attributes:
        id: Experience unique identifier from MongoDB ObjectId.
            Aliased from "_id" to match MongoDB document structure.
            Used for all experience-related operations and solution references.
        userId: Owner's user ID for access control and data organization.
            Links experience to specific user account for privacy and security.
        title: Experience title for display and identification.
            Decrypted for client display while maintaining encryption at rest.
        content: Complete experience content including text and media.
            Decrypted content for user interface display and editing.
        category: Experience category for organization and filtering.
            Used for user interface categorization and analytics.
        emotionalState: User's emotional context during the experience.
            Displayed for user reference and emotional tracking over time.
        tags: User-defined tags for organization and search functionality.
            Enables user-driven categorization and experience filtering.
        privacy: Current privacy settings for user control display.
            Shows user their current data sharing and usage preferences.
        metadata: Experience metadata including processing stage and context.
            Provides processing status and contextual information for user interface.
        createdAt: Experience creation timestamp in ISO format.
            Used for chronological sorting and experience timeline display.
        updatedAt: Last modification timestamp in ISO format.
            Tracks when experience was last edited or processed.
    """

    id: str = Field(..., alias="_id")
    userId: str
    title: str
    content: ExperienceContent
    category: ExperienceCategory
    emotionalState: ExperienceEmotionalState
    tags: List[str]
    privacy: ExperiencePrivacy
    metadata: ExperienceMetadata
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}


class ExperienceInDB(BaseModel):
    """Experience model for database storage with encryption and full metadata.

    Represents the complete experience record as stored in the database,
    including encrypted sensitive content and comprehensive metadata for
    AI processing and user management. Used only for database operations.

    Attributes:
        id: MongoDB ObjectId as string, None for new experiences before insertion.
            Aliased from "_id" to match MongoDB document structure.
            Primary key for database operations and foreign key references.
        userId: Owner's user ID for data organization and access control.
            Indexed for efficient user-specific queries and privacy enforcement.
        title: Experience title stored in encrypted format.
            Encrypted to protect user privacy while enabling search capabilities.
        content: Complete experience content with encrypted sensitive data.
            Text and media metadata encrypted while preserving structure for processing.
        category: Experience category for AI processing specialization.
            Stored in plain text for efficient querying and analytics.
        emotionalState: User's emotional context with encrypted description.
            Primary state and intensity in plain text, detailed description encrypted.
        tags: User-defined tags for organization and search.
            Default: Empty list, stored in plain text for search functionality.
        privacy: User's privacy preferences for data usage control.
            Controls how experience data can be used and shared.
        metadata: Processing metadata with encrypted location data.
            Processing stage in plain text, location encrypted for privacy.
        createdAt: Experience creation timestamp, set automatically.
            Used for chronological ordering and analytics.
        updatedAt: Last modification timestamp, updated on changes.
            Tracks when experience content or metadata was last modified.
    """

    id: Optional[str] = Field(None, alias="_id")
    userId: str
    title: str  # Encrypted
    content: ExperienceContent
    category: ExperienceCategory
    emotionalState: ExperienceEmotionalState
    tags: List[str] = []
    privacy: ExperiencePrivacy
    metadata: ExperienceMetadata
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
